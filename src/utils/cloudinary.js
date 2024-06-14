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
const deleteOldFileInCloudinary = async (oldData) => {
  try {
    if (!oldData) return null;

    const publicIdToDelete = oldData.split("/").pop().split(".")[0];
    console.log("publicIdToDelete ", publicIdToDelete);

    const result = await cloudinary.uploader.destroy(publicIdToDelete, { resource_type: "image" });

    if (result.result !== 'ok') {
      throw new ApiError(401, "Error in deleting file from cloud");
    }

    return result;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return null;
  }
};

const deleteOldVideoFileInCloudinary = async (videoUrl) => {
  try {
    if (!videoUrl) {
      throw new ApiError(400, "Video URL is required");
    }

    const oldVideoPublicId = videoUrl.split("/").pop().split(".")[0];
    console.log("Old Video Public ID to delete:", oldVideoPublicId);

    const response = await cloudinary.uploader.destroy(
      oldVideoPublicId,
      { resource_type: "video" }
    );

    console.log("Deleted video from Cloudinary:", response);

    return response;
  } catch (error) {
    console.error("Error deleting video from Cloudinary:", error);
    return null; 
  }
};


export {uploadOnCloudinary, deleteOldFileInCloudinary, deleteOldVideoFileInCloudinary}
