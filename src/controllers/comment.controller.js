import mongoose from "mongoose"
const { isValidObjectId } = mongoose;
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    // const comments = await Comment.aggregatePaginate(
    //     {video: videoId},
    //     {
    //         page: parseInt(page),
    //         limit: parseInt(limit),
    //         sort: {createdAt:"desc"},
    //         customLabels:{
    //             docs:"comments"
    //         }
    //     }       
    // )
    const comments = await Comment.aggregate([
        {
            $match: {
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup :{
                from: "user",
                localField: "commentedBy",
                foreignField: "_id",
                as: "commentedBy",
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
            $addFields:{
                commentedBy:{
                    $first: "$commentedBy"
                }
            }
        },
        {
            $skip: (page -1) * limit
        },
        {
            $limit: limit
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments are fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    if(!content?.trim()){
        throw new ApiError(400, "Comment text is required")
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {comment}, "Comment is created successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID")
    }

    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Comment text is required")
    }
    const comment = await Comment.findByIdAndUpdate(
        commentId, 
        {
            $set:{
                content
            }
        }, 
        {new: true})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment is updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID")
    }
    
    await Comment.findByIdAndDelete(commentId)
    return res
    .status(200)
    .json( new ApiResponse(200, {},"Comment deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
