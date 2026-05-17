export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          flag_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          flag_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          flag_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          country_id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          country_id: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          country_id?: string;
          name?: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_country_id_fkey";
            columns: ["country_id"];
            referencedRelation: "countries";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          league_id: string;
          name: string;
          short_name: string | null;
          city: string | null;
          stadium: string | null;
          founded_year: number | null;
          logo_url: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          name: string;
          short_name?: string | null;
          city?: string | null;
          stadium?: string | null;
          founded_year?: number | null;
          logo_url?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          name?: string;
          short_name?: string | null;
          city?: string | null;
          stadium?: string | null;
          founded_year?: number | null;
          logo_url?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Country = Database["public"]["Tables"]["countries"]["Row"];
export type League = Database["public"]["Tables"]["leagues"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];

export type LeagueWithCountry = League & {
  countries: Country | null;
};

export type TeamWithLeague = Team & {
  leagues:
    | (League & {
        countries: Country | null;
      })
    | null;
};
