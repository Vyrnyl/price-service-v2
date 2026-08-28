import { z } from "zod";

export const commodityStatusEnum = z.enum(["Active", "Inactive"]);
export const commodityStatusOptions = commodityStatusEnum.options;
export type CommodityStatus = z.infer<typeof commodityStatusEnum>;

export const createCommoditySchema = z
  .object({
    name: z.string().trim().min(1, "Commodity name is required"),
    category: z.string().trim().min(1, "Category is required"),
    status: commodityStatusEnum,
    srpPrice: z.string().trim().optional().default(""),
    srpEffectiveDate: z.string().trim().optional().default(""),
  })
  .refine((data) => Boolean(data.srpPrice) === Boolean(data.srpEffectiveDate), {
    message: "Provide both SRP price and effective date, or leave both blank",
    path: ["srpEffectiveDate"],
  })
  .refine((data) => !data.srpPrice || Number(data.srpPrice) > 0, {
    message: "Price must be greater than 0",
    path: ["srpPrice"],
  });

export type CreateCommodityFormSchema = z.infer<typeof createCommoditySchema>;
