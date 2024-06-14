import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from './../models/user.model.js';

const getChannelStats = asyncHandler(async (req, res) => {
    const channelStats = await User.aggregate([
        {
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "allVideos",
                pipeline: [
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
                            likesCount: {$size: "$likes"}
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }, 
        {
            $addFields: {
                totalVideos: {$size: "$allVideos"},
                totalSubscribers: {$size: "$subscribers"},
                totalLikes: {$sum: "$allVideos.likesCount"},
                totalViews: {$sum: "$allVideos.views"}
            }
        },
        {
            $project:{
                totalVideos: 1,
                totalSubscribers: 1,
                totalLikes: 1,
                totalViews: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                fullName: 1

            }
        }
    ])
    if(channelStats.length < 1){
        throw new ApiError(400, "Channel not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, channelStats[0], "channel stats get successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const videos = await Video.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(req.user?._id)
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
                likesCount: {$size: "$likes"}
            }
        }, 
        {
            $project: {
                likes: 0
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, videos, "get all video of channel successfuly"))
})

export {
    getChannelStats, 
    getChannelVideos
    }