import mongoose from "mongoose"
const { isValidObjectId } = mongoose;
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from './../models/like.model.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const isLiked = await Like.findOne({
        likedBy: new mongoose.Types.ObjectId(userId),
        video: new mongoose.Types.ObjectId(videoId)
    });

    if (!isLiked) {
        const liked = await Like.create({
            likedBy: new mongoose.Types.ObjectId(userId),
            video: new mongoose.Types.ObjectId(videoId)
        });

        if (!liked) {
            throw new ApiError(500, "Failed to like the video");
        }
    } else {
        const unliked = await Like.findByIdAndDelete(isLiked._id);

        if (!unliked) {
            throw new ApiError(500, "Failed to unlike the video");
        }

        return res.status(200).json(new ApiResponse(200, {}, "Video unliked successfully"));
    }
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Validate commentId and userId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Check if the comment is already liked by the user
    const isLiked = await Like.findOne({
        likedBy: new mongoose.Types.ObjectId(userId),
        comment: new mongoose.Types.ObjectId(commentId)
    });

    // If not liked, add a like
    if (!isLiked) {
        const liked = await Like.create({
            likedBy: new mongoose.Types.ObjectId(userId),
            comment: new mongoose.Types.ObjectId(commentId)
        });

        if (!liked) {
            throw new ApiError(500, "Failed to like the comment");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment liked successfully"));
    } else {
        // If already liked, remove the like
        const unliked = await Like.findByIdAndDelete(isLiked._id);

        if (!unliked) {
            throw new ApiError(500, "Failed to unlike the comment");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment unliked successfully"));
    }
});


const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    // Validate tweetId and userId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Check if the tweet is already liked by the user
    const isLiked = await Like.findOne({
        likedBy: new mongoose.Types.ObjectId(userId),
        tweet: new mongoose.Types.ObjectId(tweetId)
    });

    // If already liked, remove the like
    if (isLiked) {
        const unliked = await Like.deleteOne({
            likedBy: new mongoose.Types.ObjectId(userId),
            tweet: new mongoose.Types.ObjectId(tweetId)
        });

        if (!unliked) {
            throw new ApiError(500, "Failed to unlike the tweet");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet unliked successfully"));
    } else {
        // If not liked, add a like
        const liked = await Like.create({
            likedBy: new mongoose.Types.ObjectId(userId),
            tweet: new mongoose.Types.ObjectId(tweetId)
        });

        if (!liked) {
            throw new ApiError(500, "Failed to like the tweet");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet liked successfully"));
    }
});


const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Aggregate liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "allVideos"
            }
        },
        {
            $unwind: {
                path: "$allVideos"
            }
        },
        {
            $project: {
                _id: "$allVideos._id",
                title: "$allVideos.title",
                owner: "$allVideos.owner",
                videoFile: "$allVideos.videoFile",
                createdAt: "$allVideos.createdAt"
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}