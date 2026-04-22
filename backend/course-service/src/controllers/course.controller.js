const svc = require('../services/course.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../../shared/utils/response');

const list    = async (req, res, next) => { try { const r = await svc.listCourses(req.query); sendPaginated(res, r.courses, r); } catch(e){next(e);} };
const getOne  = async (req, res, next) => { try { sendSuccess(res, await svc.getCourseById(req.params.id, req.user?.id)); } catch(e){next(e);} };
const create  = async (req, res, next) => { try { sendCreated(res, await svc.createCourse(req.body, req.user.id)); } catch(e){next(e);} };
const update  = async (req, res, next) => { try { sendSuccess(res, await svc.updateCourse(req.params.id, req.body, req.user.id, req.user.role)); } catch(e){next(e);} };
const enroll  = async (req, res, next) => { try { sendSuccess(res, await svc.enrollCourse(req.params.id, req.user.id), 'Enrolled successfully'); } catch(e){next(e);} };
const complete = async (req, res, next) => { try { sendSuccess(res, await svc.completeLesson(req.params.lessonId, req.user.id), 'Lesson completed'); } catch(e){next(e);} };

module.exports = { list, getOne, create, update, enroll, complete };
