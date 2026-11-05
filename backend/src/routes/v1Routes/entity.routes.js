import express from "express";
import { EntityController } from "../../controllers/index.js";

export const createCrudRouter = (entityName) => {
  const router = express.Router();
  router.get("/", (req, res, next) => {
    req.params.entity = entityName;
    return EntityController.list(req, res, next);
  });
  router.get("/:id", (req, res, next) => {
    req.params.entity = entityName;
    return EntityController.get(req, res, next);
  });
  router.post("/", (req, res, next) => {
    req.params.entity = entityName;
    return EntityController.create(req, res, next);
  });
  router.put("/:id", (req, res, next) => {
    req.params.entity = entityName;
    return EntityController.update(req, res, next);
  });
  router.delete("/:id", (req, res, next) => {
    req.params.entity = entityName;
    return EntityController.delete(req, res, next);
  });
  router.post("/bulk-update", (req, res, next) => {
    req.params.entity = entityName;
    return EntityController.bulkUpdate(req, res, next);
  });
  router.post("/delete-many", (req, res, next) => {
    req.params.entity = entityName;
    return EntityController.deleteMany(req, res, next);
  });
  return router;
};

const genericRouter = express.Router();
genericRouter.get("/:entity", EntityController.list);
genericRouter.get("/:entity/:id", EntityController.get);
genericRouter.post("/:entity", EntityController.create);
genericRouter.put("/:entity/:id", EntityController.update);
genericRouter.delete("/:entity/:id", EntityController.delete);
genericRouter.post("/:entity/bulk-update", EntityController.bulkUpdate);
genericRouter.post("/:entity/delete-many", EntityController.deleteMany);

export default genericRouter;

