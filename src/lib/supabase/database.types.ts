export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          university_id: string;
          role: "student" | "admin";
          signup_intent: "student" | "organization_manager" | "both";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          university_id: string;
          role?: "student" | "admin";
          signup_intent?: "student" | "organization_manager" | "both";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          university_id?: string;
          role?: "student" | "admin";
          signup_intent?: "student" | "organization_manager" | "both";
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_memberships: {
        Row: {
          id: string;
          user_id: string;
          university_id: string;
          organization_id: string;
          role: "member" | "manager";
          status: "pending" | "active" | "revoked";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          university_id: string;
          organization_id: string;
          role?: "member" | "manager";
          status?: "pending" | "active" | "revoked";
          created_at?: string;
        };
        Update: {
          role?: "member" | "manager";
          status?: "pending" | "active" | "revoked";
        };
        Relationships: [];
      };
      account_deletion_requests: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_hash: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          token_hash?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
