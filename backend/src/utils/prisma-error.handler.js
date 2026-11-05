import { Prisma } from "@prisma/client";
import AppError from "./app.error.js";
import { StatusCodes } from "http-status-codes";

const enumValues = {
    AdminRole: ["ADMIN", "MEMBER"],
    OrderStatus: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
    TicketStatus: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    TicketPriority: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    SenderType: ["USER", "ADMIN"]
};

export const handlePrismaError = (error) => {
    try {
        if (error instanceof AppError) {
            throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const target = Array.isArray(error.meta?.target)
                ? error.meta.target.join(", ")
                : error.meta?.field_name ||
                error.meta?.column ||
                error.meta?.table ||
                error.meta?.modelName ||
                "resource";

            switch (error.code) {
                case "P2000":
                    throw new AppError(
                        [`${target} exceeds the allowed length`],
                        StatusCodes.BAD_REQUEST,
                    );

                case "P2001":
                case "P2025":
                    throw new AppError([`${target} not found`], StatusCodes.NOT_FOUND);

                case "P2002":
                    throw new AppError(
                        [`${target} already exists`],
                        StatusCodes.CONFLICT,
                    );

                case "P2003":
                    throw new AppError(
                        [`Invalid ${target} reference`],
                        StatusCodes.BAD_REQUEST,
                    );

                case "P2004":
                    throw new AppError(
                        ["Database constraint violation"],
                        StatusCodes.BAD_REQUEST,
                    );

                case "P2011":
                    throw new AppError(
                        [`${target} cannot be null`],
                        StatusCodes.BAD_REQUEST,
                    );

                case "P2012":
                case "P2013":
                    throw new AppError(
                        [`${target} is required`],
                        StatusCodes.BAD_REQUEST,
                    );

                case "P2024":
                    throw new AppError(
                        ["Database connection pool timeout"],
                        StatusCodes.SERVICE_UNAVAILABLE,
                    );

                case "P2034":
                    throw new AppError(
                        ["Transaction conflict, please try again"],
                        StatusCodes.CONFLICT,
                    );

                default:
                    throw new AppError(
                        ["Database operation failed"],
                        StatusCodes.BAD_REQUEST,
                    );
            }
        }

        // Initialization Error
        if (error instanceof Prisma.PrismaClientInitializationError) {
            throw new AppError(
                ["Database connection failed"],
                StatusCodes.SERVICE_UNAVAILABLE,
            );
        }

        // Validation Error
        if (error instanceof Prisma.PrismaClientValidationError) {
            const rawMessage = error.message;

            const argumentMessages = rawMessage.match(/Argument `.+?`[^\n]+/g);

            if (argumentMessages) {
                throw new AppError(
                    argumentMessages.map((m) => m.trim()),
                    StatusCodes.BAD_REQUEST,
                );
            }

            const invalidEnumValue = rawMessage.match(
                /`(\w+)` is not a valid value for enum `(\w+)`\. (.*?)(?=\n|$)/,
            );
            if (invalidEnumValue) {
                const enumValues = rawMessage.match(
                    /accepted values are:?\s*(.+?)(?=\n|$)/i,
                );
                const suggestion = enumValues
                    ? `Accepted values: ${enumValues[1]}`
                    : "";
                throw new AppError(
                    [
                        `Invalid value '${invalidEnumValue[1]}' for ${invalidEnumValue[2]}. ${suggestion}`,
                    ],
                    StatusCodes.BAD_REQUEST,
                );
            }

            const invalidEnumArg = rawMessage.match(
                /Invalid value for argument `(\w+)`\. Expected (\w+)/,
            );
            if (invalidEnumArg) {
                const valid = enumValues[invalidEnumArg[2]];
                const suggestion = valid
                    ? `Accepted values: ${valid.join(", ")}`
                    : `Expected type: ${invalidEnumArg[2]}`;
                throw new AppError(
                    [`Invalid value for '${invalidEnumArg[1]}'. ${suggestion}`],
                    StatusCodes.BAD_REQUEST,
                );
            }

            const unknownArg = rawMessage.match(
                /Unknown argument `(\w+)`\. Did you mean `(\w+)`\?/,
            );
            if (unknownArg) {
                throw new AppError(
                    [`Unknown argument '${unknownArg[1]}'. Did you mean '${unknownArg[2]}'?`],
                    StatusCodes.BAD_REQUEST,
                );
            }

            const missingField = rawMessage.match(
                /Argument `(\w+)` is missing\.?/,
            );
            if (missingField) {
                throw new AppError(
                    [`Field '${missingField[1]}' is required`],
                    StatusCodes.BAD_REQUEST,
                );
            }

            throw new AppError([rawMessage], StatusCodes.BAD_REQUEST);
        }

        // Rust Panic
        if (error instanceof Prisma.PrismaClientRustPanicError) {
            throw new AppError(
                ["Database engine crashed"],
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }

        // Unknown Prisma Error
        if (error instanceof Prisma.PrismaClientUnknownRequestError) {
            throw new AppError(
                ["Unknown database error"],
                StatusCodes.INTERNAL_SERVER_ERROR,
            );
        }

        /**
         * Fallback for any other error
         */
        throw new AppError(
            ["Something went wrong"],
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
    } catch (err) {
        throw err;
    }
};
