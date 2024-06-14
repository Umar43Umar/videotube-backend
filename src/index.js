// require('dotenv').config()
import dontenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';

dontenv.config({
  path: "./src"
})

const port = process.env.PORT

connectDB()
.then(()=>{
  app.listen(port || 8000, ()=>{
    console.log(`⚙️ Server is running at port: ${port}`)
  })
})
.catch((err=>{
  console.log("MONGO db connection failed" ,err)
}))





















// (async()=>{
//   try{
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//   }catch(error){
//     console.log("ERROR", error)
//     throw err
//   }
// })()