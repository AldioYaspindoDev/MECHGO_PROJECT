import Prisma from "../config/database.js"

// =============
// ambil semua user
// =============
export const GetAllUsers = async () => {
    return await Prisma.users.findMany();
};

// =============
// create user / registrasi
// =============
export const createUsers = async (data) => {
    return await Prisma.users.create({
        data
    });
}

// ==============
// mengabil email user
// ==============
export const getEmail = async (email) => {
    return await Prisma.users.findUnique({
        where : { email }
    });
}

// ==========
// ==========
// ==========
export const findUserByToken = async (token) => {
    return await Prisma.users.findFirst({ // Pakai findFirst karena token bukan @id
        where: { verification_token: token }
    });
}

export const enableUser = async (email) => {
    return await Prisma.users.update({
        where: { email: email },
        data: {
            is_verified: true,
            email_verified_at: new Date(),
            verification_token: null // Hapus token agar tidak bisa dipakai lagi
        }
    });
}
// ==============
// mengambil nomor telephone user
// ==============
export const getPhone = async (phone) => {
    return await Prisma.users.findUnique({
        where: {phone}
    })
}

// ==========
// mengambil id user
// ==========
export const findUserById = async (id) => {
    return await Prisma.users.findUnique({
        where: { id }
    });
};

// =============
// update user
// =============
export const updateUser = async (id, data) => {
    return await Prisma.users.update({
        where: { id },
        data
    });
};

// ===========
// delete user
// ===========
export const deleteUser = async (id) => {
    return await Prisma.users.delete({
        where: {
            id
        }
    });
}