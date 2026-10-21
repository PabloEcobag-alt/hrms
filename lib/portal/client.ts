export type Staff = {
  name: string;
  username: string;
  email: string;
  role: string;
};

export type Validation =
  | { decision: "allowed"; staff: Staff }
  | { decision: "invalid" }
  | { decision: "denied" }
  | { decision: "unavailable" };
