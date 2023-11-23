import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'


export const getTournaments = async (req: Request, res: Response): Promise<void> => {
    try {
       
        
        const rows = await prismaClient.tournament.findMany({
            take :  Number(req.query.take),
            skip : Number(req.query.skip),
            

        })
        res.status(200).send(rows);
    }
    catch(error)
    {
        console.error(error)
        res.status(400).send(error)
    }
    
};