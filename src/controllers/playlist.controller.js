import mongoose from "mongoose"
const { isValidObjectId } = mongoose;
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if([name, description].some((field)=>field?.trim()=== "" || field.trim() === undefined)){
        throw new ApiError(400, "Please fill all fields")
    }
    const playlist = await Playlist.create({
        name, 
        description, 
        owner: new mongoose.Types.ObjectId(req.user._id)
    })
    const createdPlaylist = await Playlist.findById(playlist._id);
    return res
    .status(200)
    .json(new ApiResponse(200, {createdPlaylist}, "playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID")
    }
    const playlists = await Playlist.find({
        owner: new mongoose.Types.ObjectId(userId)
    })
    return res
    .status(200)
    .json(new ApiResponse(200, {playlists}, "playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, {playlist}, "playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new ApiError(400, "Please provide both playlist ID and video ID")
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$push: {
            videos: new mongoose.Types.ObjectId(videoId)
        }},
        {new: true}
    )
    if(!playlist){
        throw new ApiError(500, "something went wrong while adding video on playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, {playlist}, "video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId){
        throw new ApiError(400, "Please provide both playlist ID and video ID")
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$pull: {
            videos: new mongoose.Types.ObjectId(videoId)
        }},
        {new: true}
    )
    if(!playlist){
        throw new ApiError(500, "something went wrong while removing video from playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, {playlist}, "video removed from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400, "Please provide playlist ID")
    }
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
    if(!deletedPlaylist){
        throw new ApiError(500, "something went wrong while deleting playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!playlistId){
        throw new ApiError(400, "Please provide playlist ID")
    }
    if (
        [name, description].some(
          (field) => field?.trim() === "" || field.trim() === undefined
        )
      ) {
        throw new ApiError(400, "Fields are required");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name: name,
                description: description
            }
        },
        { new: true }
    )
    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
