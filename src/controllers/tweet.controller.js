import mongoose from "mongoose"
const { isValidObjectId } = mongoose;
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content}= req.body
    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    if([content].some((field)=>field?.trim() === "" || field.trim() === undefined)){
        throw new ApiError(400, "Please fill all fields")
    }
    const tweet = await Tweet.create({
        content, 
        owner: user._id
    })
    if(!tweet){
        throw new ApiError(500, "Failed to create tweet")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,tweet, "Tweet created successfully", tweet))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = await User.findById(userId)
    if (!userId) {
        throw new ApiError(404, "User not found")
    }
    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        }
    ])
    if (!userTweets) {
        throw new ApiError(404, "No tweets found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {tweetId} = req.params
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            $set:{
                content: content
            }
        },
        {new:true}
    )
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400, "Tweet ID is required")
    }
    const delTweet = await Tweet.findByIdAndRemove(tweetId)
    if(!delTweet){
        throw new ApiError(404, "Tweet not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, {delTweet}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
