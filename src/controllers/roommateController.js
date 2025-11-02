const RoommatePost = require('../models/RoommatePost');

exports.createPost = async (req, res) => {
  try {
    // Log incoming request for easier debugging
    console.log('[roommateController] createPost body:', req.body);
    console.log('[roommateController] createPost user:', req.user);

    const { boardingHouseId, roomId, intro, genderPreference, habits, note } = req.body;

    // Validate required fields
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: user not found in request' });
    }
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

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await RoommatePost.find({})
      .populate('userId', 'name avatar phone gender')
      .populate('boardingHouseId', 'name address') // optional
      .sort({ createdAt: -1 });

    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Error fetching all roommate posts', error);
    return res.status(500).json({ message: 'Error fetching posts', error });
  }
};
