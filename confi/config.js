
let mongoose=require("mongoose");




const ConnectDb= async()=>{

try{

await mongoose.connect(process.env.MONGO_URI);
console.log("MOngo Db connected")
}catch(e){
console.log("error coming plese hndle it", e.message)
}


}



module.exports=ConnectDb