let express=require("express");
let dotenv=require("dotenv");
let cors=require("cors")
let ConnectDb= require("./confi/config");
const {userRouter, quizrouter, tpoicrouter, questionrouter} = require("./routes/user.routes");
dotenv.config()
let app= express();
app.use(express.json())
const PORT = process.env.PORT || 3000;
app.use(cors())
app.get("/test",(req,res)=>{
res.json({message:"this is test mode"})
})

app.use("/Users",userRouter)

app.use("/quizes",quizrouter)
app.use("/topics",tpoicrouter)
app.use("/questions", questionrouter)





app.listen(PORT,()=>{
    ConnectDb()
    console.log("server started")
})


