"use client"; // Ensures this runs only on the client side
import { useEffect } from "react";

const TidioChat = () => {
  useEffect(() => {
    // Avoid loading the script multiple times
    if (document.getElementById("tidio-script")) return;

    const script = document.createElement("script");
    script.id = "tidio-script";
    script.src = "//code.tidio.co/nt2brgxfckiqjhhoteb5deudjibllieh.js"; // Replace with your Tidio script
    script.async = true;
    document.body.appendChild(script);
  }, []);
  {
    /* <script
  src="//code.tidio.co/nt2brgxfckiqjhhoteb5deudjibllieh.js"
  async
></script>; */
  }
  return null; // No UI component needed, just loads Tidio
};

export default TidioChat;
