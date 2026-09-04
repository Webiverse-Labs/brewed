import express from "express";

export async function getTest(req, res) {
  res.send("hello world from the server");
}
