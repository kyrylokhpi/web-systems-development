import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import serve from "koa-static";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(import.meta.dirname, "prisma", "dev.db")}`,
});

const app = new Koa();
const router = new Router();
const prisma = new PrismaClient({ adapter });

app.use(bodyParser());
app.use(serve(path.join(import.meta.dirname, "public")));

// Error handling
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err: any) {
        ctx.status = err.status || 500;
        ctx.body = { error: err.message };
    }
});

// POST /api/users — create user
router.post("/api/users", async (ctx) => {
    const { firstName, lastName, email, password } = ctx.request.body as any;

    if (!firstName || !lastName || !email || !password) {
        ctx.status = 400;
        ctx.body = { error: "Усі поля обов'язкові" };
        return;
    }

    if (password.length < 8) {
        ctx.status = 400;
        ctx.body = { error: "Пароль має містити щонайменше 8 символів" };
        return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        ctx.status = 409;
        ctx.body = { error: "Користувач з такою поштою вже існує" };
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { firstName, lastName, email, password: hashedPassword },
    });

    ctx.status = 201;
    ctx.body = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
    };
});

// GET /api/users — list all users (with optional search)
router.get("/api/users", async (ctx) => {
    const search = ctx.query.search as string | undefined;

    const where = search
        ? {
              OR: [
                  { email: { contains: search } },
                  { firstName: { contains: search } },
                  { lastName: { contains: search } },
              ],
          }
        : {};

    const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    ctx.body = users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        createdAt: u.createdAt,
    }));
});

// GET /api/users/:id — get single user
router.get("/api/users/:id", async (ctx) => {
    const user = await prisma.user.findUnique({
        where: { id: parseInt(ctx.params.id) },
    });

    if (!user) {
        ctx.status = 404;
        ctx.body = { error: "Користувача не знайдено" };
        return;
    }

    ctx.body = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
    };
});

// PUT /api/users/:id — update user
router.put("/api/users/:id", async (ctx) => {
    const id = parseInt(ctx.params.id);
    const { firstName, lastName, email, password } = ctx.request.body as any;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
        ctx.status = 404;
        ctx.body = { error: "Користувача не знайдено" };
        return;
    }

    const data: any = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email) data.email = email;
    if (password && password.length > 0) {
        data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
        where: { id },
        data,
    });

    ctx.body = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
    };
});

// DELETE /api/users/:id — delete user
router.del("/api/users/:id", async (ctx) => {
    const id = parseInt(ctx.params.id);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
        ctx.status = 404;
        ctx.body = { error: "Користувача не знайдено" };
        return;
    }

    await prisma.user.delete({ where: { id } });
    ctx.status = 204;
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
