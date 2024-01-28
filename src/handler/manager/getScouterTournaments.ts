import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z, { ZodNumber } from 'zod'
import { unwatchFile } from "fs";
import { AuthenticatedRequest } from "../../lib/middleware/requireAuth";
import { userInfo } from "os";
import { scoutingLead } from "../analysis/scoutingLead";


export const getScouterTournaments = async (req: Request, res: Response): Promise<void> => {
    try {
        let rows = await prismaClient.tournament.findMany({
            orderBy:
            {
                date: 'asc'
            }
        })
        if (req.query.filter != undefined) {
            if (req.query.skip != undefined) {
                if (req.query.take != undefined) {

                    const params = z.object({
                        take: z.number(),
                        skip: z.number(),
                        filter: z.string()
                    }).safeParse({
                        take: Number(req.query.take),
                        skip: Number(req.query.skip),
                        filter: req.query.filter
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    let rows = await prismaClient.tournament.findMany({
                        take: params.data.take,
                        skip: params.data.skip,
                        where:
                        {
                            OR: [{ key: { contains: params.data.filter } },
                            { name: { contains: params.data.filter } }]
                        },
                        orderBy:
                        {
                            date: 'asc'
                        }


                    })

                }
                else {

                    const params = z.object({
                        skip: z.number(),
                        filter: z.string()
                    }).safeParse({
                        skip: Number(req.query.skip),
                        filter: req.query.filter
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows = await prismaClient.tournament.findMany({
                        skip: params.data.skip,
                        where:
                        {
                            OR: [{ key: { contains: params.data.filter } },
                            { name: { contains: params.data.filter } }]
                        },
                        orderBy:
                        {
                            date: 'asc'
                        }


                    })
                }
            }
            else {
                if (req.query.take != undefined) {

                    const params = z.object({
                        take: z.number(),
                        filter: z.string()
                    }).safeParse({
                        take: Number(req.query.take),
                        filter: req.query.filter
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows = await prismaClient.tournament.findMany({
                        take: params.data.take,
                        where:
                        {
                            OR: [{ key: { contains: params.data.filter } },
                            { name: { contains: params.data.filter } }]
                        },
                        orderBy:
                        {
                            date: 'asc'
                        }


                    })

                }
                else {
                    const params = z.object({
                        filter: z.string()
                    }).safeParse({
                        filter: req.query.filter
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows = await prismaClient.tournament.findMany({
                        where:
                        {
                            OR: [{ key: { contains: params.data.filter } },
                            { name: { contains: params.data.filter } }]
                        },
                        orderBy:
                        {
                            date: 'asc'
                        }


                    })
                }
            }
        }
        else {
            if (req.query.take != undefined) {
                if (req.query.skip != undefined) {
                    const params = z.object({
                        skip: z.number(),
                        take: z.number()
                    }).safeParse({
                        skip: Number(req.query.skip),
                        take: Number(req.query.take)
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows = await prismaClient.tournament.findMany({
                        take: params.data.take,
                        skip: params.data.skip,
                        orderBy:
                        {
                            date: 'asc'
                        }

                    })
                }
                else {
                    const params = z.object({
                        take: z.number()
                    }).safeParse({
                        take: Number(req.query.take)
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };

                    rows = await prismaClient.tournament.findMany({
                        take: params.data.take,
                        orderBy:
                        {
                            date: 'asc'
                        }
                    })
                }

            }
            else {
                if (req.query.skip != undefined) {
                    const params = z.object({
                        skip: z.number()
                    }).safeParse({
                        skip: Number(req.query.skip)
                    })
                    if (!params.success) {
                        res.status(400).send(params);
                        return;
                    };
                    rows = await prismaClient.tournament.findMany({
                        skip: params.data.skip,
                        orderBy:
                        {
                            date: 'asc'
                        }
                    })
                }

            }
        }
        let count = 0
        if (req.query.filter != undefined) {
            let tempRows = await prismaClient.tournament.findMany({
                where:
                {
                    OR: [{ key: { contains: req.query.filter as string } },
                    { name: { contains: req.query.filter as string } }]
                },
                orderBy:
                {
                    date: 'asc'
                }


            })
            count = tempRows.length
        }
        else {
            count = (await prismaClient.tournament.findMany({})).length
        }
      
        const params = z.object({
            code: z.string(),
        }).safeParse({
            code: req.headers['x-team-code'],
        })
        if (!params.success) {
            res.status(400).send({ "error": params, "displayError": "Team code is not correct." });
            return;
        };
        const teamRow = await prismaClient.registeredTeam.findUnique({
            where:
            {
                code: params.data.code
            }
        })
        if(!teamRow)
        {
            res.status(400).send({ "error": `x-team-code sent was ${params.data.code} and is not affilated with a team.`, "displayError": "Team code is not correct." })
            return
        }
        const teamTournaments = await prismaClient.teamMatchData.groupBy({
            by: ['tournamentKey'],
            where:
            {
                teamNumber: teamRow.number
            },
        })
        const presentTeamTournaments = []
        for (let i = 0; i < rows.length; i++) {
            if (teamTournaments.some(obj => obj.tournamentKey === rows[i].key)) {
                presentTeamTournaments.push(rows[i])
                rows.splice(i, 1)
                i--;
            }
        }
        rows = presentTeamTournaments.concat(rows)

        res.status(200).send({ tournaments: rows, count: count })

    }
    catch (error) {
        console.error(error)
        res.status(500).send(error)
    }

};