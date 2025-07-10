import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
    constructor(private prisma: PrismaService) {}

    async login(email: string, password: string) {
        const admin = await this.prisma.adminUser.findUnique({ where: { email } });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            throw new UnauthorizedException('Неверные данные');
        }

        const accessToken = jwt.sign(
            { id: admin.id, role: admin.role, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
        );

        return { accessToken };
    }
}
