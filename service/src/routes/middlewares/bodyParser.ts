import express, { Request, Response, NextFunction } from 'express';

const pathWithStringBody = [
    /^\/flows\/.+\/tags\/.+$/,
    /^\/flows\/.+\/description$/,
    /^\/flows\/.+\/label$/,
    /^\/flows\/.+\/read_only$/,
    /^\/flows\/.+\/flow_collection$/,
    /^\/flows\/.+\/max_bit_rate$/,
    /^\/flows\/.+\/avg_bit_rate$/,
];

export const bodyParser = (req: Request, res: Response, next: NextFunction) => {
    // retrieve string body
    if (pathWithStringBody.some(p => p.test(req.path))) {
        let data: string | undefined = undefined;
        req.setEncoding('utf8');
        req.on('data', function(chunk) {
            data = data || '';
            data += chunk;
        });
        req.on('end', function() {
            req.body = data;
            next();
        });
        return;
    }
    return express.json()(req, res, next);
}
