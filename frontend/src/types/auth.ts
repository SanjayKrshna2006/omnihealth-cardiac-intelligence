export interface Doctor {
  id: string;
  name: string;
  title: string;
  email: string;
  specialization: string;
  department: string;
  hospital: string;
  avatar_initials: string;
  license_number: string;
  role: string;
  active_cases: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  doctor: Doctor;
  message: string;
}
