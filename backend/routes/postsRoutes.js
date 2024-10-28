const { Router } = require("express");
const {
  getPosts,
  createPost,
  updatePost,
  deletePost,
} = require("../controllers/PostController");
const { check } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

/**
 * @swagger
 * /posts:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Создание поста
 *     description: Creates a new post
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully created
 */
router.post(
  "/",
  [authMiddleware, check("message", "Сообщение поста обязательно").notEmpty()],
  createPost
);

/**
 * @swagger
 * /posts:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Получение всех постов
 *     description: Returns all posts
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of posts
 */
router.get("/", authMiddleware, getPosts);

/**
 * @swagger
 * /posts/{postId}:
 *   put:
 *     tags:
 *       - Posts
 *     summary: Изменение поста
 *     description: Update post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the post to retrieve.
 *         schema:
 *           type: integer
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully update
 */
router.put(
  "/:id",
  [authMiddleware, check("message", "Сообщение поста обязательно").notEmpty()],
  updatePost
);

/**
 * @swagger
 * /posts/{postId}:
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Удаление поста
 *     description: Delete post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the post to retrieve.
 *         schema:
 *           type: integer
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully deleted
 */
router.delete("/:id", authMiddleware, deletePost);

module.exports = router;
