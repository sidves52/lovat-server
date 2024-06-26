import { Request, Response } from "express";
import prismaClient from '../../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../../lib/middleware/requireAuth";
import { singleMatchEventsAverage } from "./singleMatchEventsAverage";
import { autoEnd, matchTimeEnd, teamLowerBound, teleopStart, tournamentLowerBound } from "../analysisConstants";
import { error, time } from "console";
import { Position } from "@prisma/client";
import { arrayAndAverageTeamFast } from "./arrayAndAverageTeamFast";


export const arrayAndAverageAllTeam = async (req: AuthenticatedRequest, metric: string): Promise<{ average: number, timeLine: Array<number> }> => {
    try {
        return new Promise(async (resolve, reject) => {
            let teams = []
            if (req.user.teamSource.length >= teamLowerBound) {
                if (req.user.tournamentSource.length >= tournamentLowerBound) {
                    teams = await prismaClient.scoutReport.findMany({
                        where:
                        {

                        },
                        include:
                        {
                            teamMatchData: true
                        }
                    })
                }
                else {
                    teams = await prismaClient.scoutReport.findMany({
                        where:
                        {

                            teamMatchData:
                            {
                                tournamentKey:
                                {
                                    in: req.user.tournamentSource
                                }
                            }
                        },
                        include:
                        {
                            teamMatchData: true
                        }
                    })
                }
            }
            else {
                if (req.user.tournamentSource.length >= tournamentLowerBound) {
                    teams = await prismaClient.scoutReport.findMany({
                        where:
                        {
                            teamMatchData:
                            {
                                tournamentKey:
                                {
                                    in: req.user.tournamentSource
                                }
                            }
                        },
                        include:
                        {
                            teamMatchData: true
                        }
                    })
                }
                else {
                    teams = await prismaClient.scoutReport.findMany({
                        where:
                        {
                            scouter:
                            {
                                sourceTeamNumber:
                                {
                                    in: req.user.teamSource
                                }
                            },
                            teamMatchData:
                            {
                                tournamentKey:
                                {
                                    in: req.user.tournamentSource
                                }
                            }

                        },
                        include:
                        {
                            teamMatchData: true
                        }
                    })
                }
            }
            const uniqueTeams: Set<number> = new Set();

            for (const element of teams) {
                if (element) {
                    uniqueTeams.add(element.teamMatchData.teamNumber);
                }
            };
            const uniqueTeamsArray: Array<number> = Array.from(uniqueTeams);
            let timeLineArray = []
            for (const element of uniqueTeamsArray) {
                const currAvg = (arrayAndAverageTeamFast(req.user, metric, element))
                timeLineArray = timeLineArray.concat(currAvg)
            };
            //change to null possibly
            let average = 0

            await Promise.all(timeLineArray).then((values) => {

                if (timeLineArray.length !== 0) {
                    average = values.reduce((acc, cur) => acc + cur.average, 0) / values.length;
                }
                timeLineArray = values.map(item => item.average);
            });
            resolve({
                average: average,
                timeLine: timeLineArray
            })

        })
    }
    catch (error) {
        console.log(error)
        throw (error)
    }

};