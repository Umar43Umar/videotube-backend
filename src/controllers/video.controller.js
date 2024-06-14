import mongoose from "mongoose"
const { isValidObjectId } = mongoose;
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let {
        page = 1,
        limit = 10,
        query = "",
        sortBy,
        sortType,
        userId
    } = req.query;

    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(limit) ? 10 : Number(limit);

    if (page < 1) {
        page = 1;
    }
    if (limit <= 10) {
        limit = 10;
    }

    const matchStage = {};

    if (userId && isValidObjectId(userId)) {
        matchStage["$match"] = {
            owner: new mongoose.Types.ObjectId(userId)
        };
    } else if (query) {
        matchStage["$match"] = {
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } }
            ]
        };
    } else {
        matchStage["$match"] = {};
    }

    if (userId && query) {
        matchStage["$match"] = {
            $and: [
                { owner: new mongoose.Types.ObjectId(userId) },
                {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } }
                    ]
                }
            ]
        };
    }

    const sortStage = {};

    if (sortBy && sortType) {
        sortStage["$sort"] = {
            [sortBy]: sortType === "asc" ? 1 : -1
        };
    } else {
        sortStage["$sort"] = {
            createdAt: -1
        };
    }

    const videos = await Video.aggregate([
        matchStage,
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        sortStage,
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }, // Correct way to get first element of array
                likes: { $size: "$likes" }
            }
        }
    ]);

    if (!videos.length) {
        throw new ApiError(404, "No videos found");
    }

    return res.status(200).json(new ApiResponse(200, videos, "Get all videos successfully"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if([title,description].some((field)=> field?.trim()=== "" || field.trim() === undefined )){
        throw new ApiError(400, "All fields are required")
    }
    let videoLocalPath;
    let thumbnailLocalPath;
    if(req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0){
        videoLocalPath = req.files.videoFile[0].path
    }
    if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0){
        thumbnailLocalPath = req.files.thumbnail[0].path
    }
    if(!videoLocalPath){
        throw new ApiError(400, "Video is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnail is required")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const user = await User.findById(req.user?._id).select("-password -refreshToken")
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        owner: user._id,
        duration: videoFile.duration,
        // isPublished
    })

    return res
    .status(200)
    .json(new ApiResponse(200,video, "Video published successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields:{
                likeCount: { $size: "$likes" }
            }
        },
        {
            $project:{
                likes: 0
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200,video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }
    const video = await Video.findByIdAndUpdate(
        videoId, 
        {
            $set: {
                title,
                description,
            }
        }, 
        { new: true }
    )
    return res
    .status(200)
    .json(new ApiResponse(200,video, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }
    const delVideo = await Video.findByIdAndDelete(videoId)
    return res
    .status(200)
    .json(new ApiResponse(200,delVideo, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400, "Video id is required")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    video.isPublished = !video.isPublished
    await video.save()
    return res
    .status(200)
    .json(new ApiResponse(200,video, "Video publish status updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
