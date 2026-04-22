const svc = require('../services/ai.service');
const { sendSuccess, sendCreated } = require('../../../shared/utils/response');

const generateCourse = async (req, res, next) => {
  try { sendCreated(res, await svc.generateCourse(req.body), 'Course outline generated'); }
  catch(e) { next(e); }
};

const generateQuiz = async (req, res, next) => {
  try { sendCreated(res, await svc.generateQuiz(req.body), 'Quiz generated'); }
  catch(e) { next(e); }
};

const chat = async (req, res, next) => {
  try {
    const result = await svc.chat({
      ...req.body,
      learner_id: req.user.id,
      learner_name: req.user.first_name || 'Learner',
      level: req.user.level || 1,
    });
    sendSuccess(res, result);
  } catch(e) { next(e); }
};

const summarize = async (req, res, next) => {
  try { sendSuccess(res, { summary: await svc.summarizeLesson(req.body) }); }
  catch(e) { next(e); }
};

const recommendations = async (req, res, next) => {
  try { sendSuccess(res, await svc.getRecommendations({ ...req.body, level: req.user.level })); }
  catch(e) { next(e); }
};

module.exports = { generateCourse, generateQuiz, chat, summarize, recommendations };
