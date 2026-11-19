function validate(zodSchema) {
    return function (req, res, next) {
        try {
            zodSchema.parse(req.body);
            return next();
        } catch (error) {
            const issues = error.issues || error.errors || [];
            const firstMessage = issues[0]?.message || 'Données invalides';
            return res.status(400).json({ message: firstMessage, details: issues });
        }
    };
}

module.exports = validate;