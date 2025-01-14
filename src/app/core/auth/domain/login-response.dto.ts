import { IUser } from '@modules/admin/user/profile/interfaces/user.interface';

export class LoginResponseDto {
  token: string;

  user: IUser;
}
