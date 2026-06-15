const { z } = require('zod');

//  valider la création d'un cours
const courseSchema = z.object({
    title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
    description: z.string().min(10, "La description doit faire au moins 10 caractères")
});

// valider l'assignation d'un cours à une cohorte
const assignSchema = z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de cours invalide"),
    assignedToCohort: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de cohorte invalide").optional(),
    assignedToUser: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID d'utilisateur invalide").optional(),
    lessonUnlockDates: z.array(z.object({
        lessonId: z.string(),
        unlockDate: z.string()
    })).optional()
});

// valider la création d'une cohorte
const cohortSchema = z.object({
    name: z.string().min(2, "Le nom doit faire au moins 2 caractères")
});

module.exports = { courseSchema, assignSchema, cohortSchema };