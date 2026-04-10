import { Request, Response } from "express";
import Application from "../models/Application";

// CREATE
export const createApplication = async (req: any, res: Response) => {
  try {
    const data = {
      ...req.body,
      user: req.user.userId,
    };

    const app = await Application.create(data);
    res.status(201).json(app);
  } catch (error) {
    res.status(500).json({ message: "Error creating application" });
  }
};

// GET ALL (for logged-in user)
export const getApplications = async (req: any, res: Response) => {
  try {
    const apps = await Application.find({ user: req.user.userId });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: "Error fetching applications" });
  }
};

// UPDATE STATUS (drag & drop later)
export const updateApplication = async (req: any, res: Response) => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(app);
  } catch (error) {
    res.status(500).json({ message: "Error updating application" });
  }
};

// DELETE
export const deleteApplication = async (req: Request, res: Response) => {
  try {
    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Application deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting application" });
  }
};