import mongoose from "mongoose"
const { isValidObjectId } = mongoose;
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const isSubscribed = await Subscription.findOne({
        $and: [
            {subscriber:new mongoose.Types.ObjectId(req.user?._id) },
            {channel: new mongoose.Types.ObjectId(channelId)}
        ]
    })
    if (!isSubscribed) {
        const subscriber = Subscription.create({
            subscriber: new mongoose.Types.ObjectId(req.user._id),
            channel: new mongoose.Types.ObjectId(channelId)
        })
        if(!subscriber){
            throw new ApiError(500, "Failed to subscribe")
        }
    }else{
        const unsubscribed = await Subscription.findByIdAndDelete(isSubscribed._id)
        return res
        .status(200)
        .json( new ApiResponse(200, {unsubscribed},"Unsubscribed successfully"))
    }
    return res
    .status(200)
    .json( new ApiResponse(200, {},"Toggle subscription successfully to subscribed "))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: { channel: new mongoose.Types.ObjectId(channelId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "allSubscribers",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$allSubscribers"
        },
        {
            $replaceRoot: { newRoot: "$allSubscribers" }
        }
    ]);

    const totalSubscribers = await Subscription.countDocuments({ channel: new mongoose.Types.ObjectId(channelId) });

    return res
        .status(200)
        .json(new ApiResponse(200, { total: totalSubscribers, subscribers: subscribers }, "Subscribers fetched successfully"));
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId) {
        throw new ApiError(400, "Subscriber id is required")
    }
    const channels = await Subscription.aggregate([
        {
            $match: {subscriber :new mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup:{
                from: "users",
                localField:"channel",
                foreignField:"_id",
                as:"allChannels",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$allChannels"
        },
        {
            $replaceRoot: { newRoot: "$allChannels" }
        }
    ])
    const totalChannels = await Subscription.countDocuments({ subscriber: new mongoose.Types.ObjectId(subscriberId) });
    return res
    .status(200)
    .json(new ApiResponse(200,{ total: totalChannels, channels: channels } ,"Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}