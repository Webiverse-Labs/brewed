import api from "./lib/api.js";
import { useState, useEffect } from "react";

function App() {
  const [data, setData] = useState("");

  //data fetching from backend
  useEffect(() => {
    const getData = async () => {
      try {
        const res = await api.get("/test");

        setData(res.data);
      } catch (error) {
        console.log(error?.response?.data);
      }
    };

    getData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl">{data}</h1>
    </div>
  );
}

export default App;
