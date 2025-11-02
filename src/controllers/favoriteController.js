const Favorite = require('../models/Favorite');
const BoardingHouse = require('../models/BoardingHouse')
const mongoose = require('mongoose');

exports.addFavorite = async (req, res) => {
  try {
    const { boardingHouseId } = req.body;
    const customerId = req.user.id;

    const accommodation = await BoardingHouse.findById(boardingHouseId);
    if (!accommodation) {
      return res.status(404).json({ message: "Accommodation not found" });
    }

    const favorite = await Favorite.create({
      boardingHouseId, customerId
    });
    res.status(200).json({ message: "Accommodation add to favorite", favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }

};

exports.deleteFavorite = async (req, res) => {
  try {
    const boardingHouseId = req.params.id;
    const customerId = req.user.id;


    const favorite = await Favorite.findOneAndDelete({ boardingHouseId, customerId });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Delete favorite successfully" });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getFavorite = async (req, res) => {
  try {
    const customerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customerId' });
    }

    const favorites = await Favorite.find({ customerId })
      .populate({
        path: 'boardingHouseId',
        model: 'BoardingHouse'
      })
      .exec();

    res.status(200).json({
      message: 'Favorites fetched successfully',
      favorites
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUserFavorites = async (req, res) => { // Renamed function for clarity
  try {
    const customerId = new mongoose.Types.ObjectId(req.user.id); // Cast ID once
    const favorites = await Favorite.aggregate([
      // 1. Match favorites for the current user
      { $match: { customerId: customerId } },
      // 2. Lookup BoardingHouse details
      {
        $lookup: {
          from: 'boardinghouses', // Collection name for BoardingHouse
          localField: 'boardingHouseId',
          foreignField: '_id',
          as: 'boardingHouseInfo'
        }
      },
      // 3. Unwind the result (since lookup returns an array)
      { $unwind: '$boardingHouseInfo' },
      // 4. Lookup Rooms associated with the BoardingHouse
      {
        $lookup: {
          from: 'rooms', // Collection name for Room
          localField: 'boardingHouseInfo._id', // Use ID from the looked-up house
          foreignField: 'boardingHouseId',
          as: 'boardingHouseInfo.rooms' // Embed rooms directly into house info
        }
      },
      // 5. Calculate necessary room stats (optional but good for frontend)
      {
        $addFields: {
          'boardingHouseInfo.minPrice': { $min: '$boardingHouseInfo.rooms.price' },
          'boardingHouseInfo.maxPrice': { $max: '$boardingHouseInfo.rooms.price' },
          'boardingHouseInfo.totalRooms': { $size: '$boardingHouseInfo.rooms' },
          'boardingHouseInfo.availableRoomsCount': {
            $size: {
              $filter: {
                input: '$boardingHouseInfo.rooms',
                as: 'room',
                cond: { $eq: ['$$room.status', 'Available'] }
              }
            }
          }
        }
      },
      // 6. Project the final structure (match frontend expectation)
      {
        $project: {
          _id: 1, // Keep favorite record ID
          userId: '$customerId', // Rename for consistency if needed
          boardingHouseId: '$boardingHouseInfo' // The populated house object
          // Remove boardingHouseInfo.rooms if frontend doesn't need the full list here
        }
      }
    ]);

    // ✅ Return structure expected by frontend
    res.status(200).json({ favorites });

  } catch (error) {
    console.error("Error fetching user favorites:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


