import app from "./app.js";
import connectDB from "./config/db.js";

//Local entry point (npm run dev / npm start). On Vercel, ../../api/index.js runs the same app instead.
const PORT = process.env.PORT;

//connect to MongoDB first before server connection
//(Express 5 passes listen errors such as "port already in use" to this callback)
connectDB()
  .then(() =>
    app.listen(PORT, (error) => {
      if (error) {
        console.error(`Could not start on PORT ${PORT}: ${error.message}`);
        process.exit(1);
      }
      console.log(`Server running on PORT: ${PORT}`);
    }),
  )
  .catch((error) => {
    console.log("Failed connecting to MongoDB:", error);
    process.exit(1); //1 means exit with failure
  });
