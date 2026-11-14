const PortfolioProject = require('../models/PortfolioProject');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');
const { deleteCloudinaryImage } = require('../services/uploadService');

const listProjects = asyncHandler(async (_req, res) => {
  const projects = await PortfolioProject.find({ published: true }).sort({ sortOrder: 1, createdAt: -1 });
  return success(res, 200, projects);
});

const listAdminProjects = asyncHandler(async (_req, res) => {
  const projects = await PortfolioProject.find({}).sort({ sortOrder: 1, createdAt: -1 });
  return success(res, 200, projects);
});

const createProject = asyncHandler(async (req, res) => {
  const { title, category, description, location = '', images = [], featured = false, published = true, sortOrder = 0 } = req.body;
  if (!title?.trim() || !category?.trim() || !description?.trim()) {
    return error(res, 400, 'Title, category and description are required');
  }
  if (!Array.isArray(images) || images.length === 0 || images.some((image) => !image?.url)) {
    return error(res, 400, 'At least one project image is required');
  }
  const project = await PortfolioProject.create({ title, category, description, location, images, featured, published, sortOrder });
  return success(res, 201, project, 'Portfolio project created');
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await PortfolioProject.findById(req.params.id);
  if (!project) return error(res, 404, 'Portfolio project not found');
  const previousImages = project.images.map((image) => ({ publicId: image.publicId, url: image.url }));
  const allowed = ['title', 'category', 'description', 'location', 'images', 'featured', 'published', 'sortOrder'];
  for (const key of allowed) if (key in req.body) project[key] = req.body[key];
  if (!project.title?.trim() || !project.category?.trim() || !project.description?.trim()) {
    return error(res, 400, 'Title, category and description are required');
  }
  if (!Array.isArray(project.images) || project.images.length === 0) {
    return error(res, 400, 'At least one project image is required');
  }
  await project.save();
  const retainedIds = new Set(project.images.map((image) => image.publicId).filter(Boolean));
  const removedImages = previousImages.filter((image) => image.publicId && !retainedIds.has(image.publicId));
  await Promise.all(removedImages.map((image) => deleteCloudinaryImage(image.publicId)));
  return success(res, 200, project, 'Portfolio project updated');
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await PortfolioProject.findById(req.params.id);
  if (!project) return error(res, 404, 'Portfolio project not found');
  await PortfolioProject.findByIdAndDelete(req.params.id);
  await Promise.all((project.images || []).map((image) => deleteCloudinaryImage(image.publicId)));
  return success(res, 200, { _id: req.params.id }, 'Portfolio project deleted');
});

module.exports = { listProjects, listAdminProjects, createProject, updateProject, deleteProject };
