import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
  try {
    if(!localFilePath) return null
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    fs.unlinkSync(localFilePath)
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath)
    return null
  }
}
const deleteOldFileInCloudinary = async(oldData)=>{
  try {
    if(!oldData) return null
    const publicIdToDelete = oldData.split("/").pop().split(".")[0];
    console.log("publicIdToDelete ", publicIdToDelete);
    await cloudinary.uploader.destroy(
      publicIdToDelete,
      { resource_type: "image" },
      (error, result) => {
        if (error) {
          throw new ApiError(401, "Error in Uploading to cloud");
        }
      }
    );
  }catch(error){
    return null
  }
}
const deleteOldVideoFileInCloudinary = async(videoUrl)=>{
  const oldVideoPublicId = videoURL.split("/").pop().split(".")[0];
  const response = await cloudinary.uploader.destroy(
    oldVideoPublicId,
    { resource_type: "video" },
    (result) => {
      console.log("Deleted video from cloudinary", result);
    }
  )
  return response
}

export {uploadOnCloudinary, deleteOldFileInCloudinary, deleteOldVideoFileInCloudinary}
