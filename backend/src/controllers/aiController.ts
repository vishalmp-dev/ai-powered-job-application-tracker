import { Request, Response } from "express";
import {
  parseJobDescription,
  generateResumePoints,
} from "../services/aiService";

export const parseJD = async (req: Request, res: Response) => {
  try {
    const { jd } = req.body;

    const data = await parseJobDescription(jd);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "AI parsing failed" });
  }
};

export const getResumeSuggestions = async (req: Request, res: Response) => {
  try {
    const { jd } = req.body;

    const suggestions = await generateResumePoints(jd);

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: "AI generation failed" });
  }
};