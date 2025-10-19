const RoommatePost = require('../models/RoommatePost');

exports.createPost = async (req, res) => {
  try {
    const { boardingHouseId, intro, genderPreference, habits } = req.body;
    const userId = req.user.id;

    const post = await RoommatePost.create({
      boardingHouseId,
      userId,
      intro,
      genderPreference,
      habits
    });

    res.status(200).json({ message: 'Roommate post created successfully', post });
  } catch (error) {
    res.status(500).json({ message: 'Error creating roommate post', error });
  }
};

exports.getPostsByAccommodation = async (req, res) => {
  try {
    const { boardingHouseId } = req.params;

    const posts = await RoommatePost.find({ boardingHouseId })
      .populate('userId', 'name avatar phone gender')
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error });
  }
};
