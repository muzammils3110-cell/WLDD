import { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(
  fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}