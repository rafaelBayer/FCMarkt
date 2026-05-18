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
      seasons: {
        Row: {
          id: string;
          name: string;
          start_year: number;
          end_year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_year: number;
          end_year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_year?: number;
          end_year?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          name: string;
          known_name: string | null;
          nationality: string | null;
          birth_date: string | null;
          main_position: string | null;
          overall: number | null;
          potential: number | null;
          photo_url: string | null;
          external_source: string | null;
          external_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          known_name?: string | null;
          nationality?: string | null;
          birth_date?: string | null;
          main_position?: string | null;
          overall?: number | null;
          potential?: number | null;
          photo_url?: string | null;
          external_source?: string | null;
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          known_name?: string | null;
          nationality?: string | null;
          birth_date?: string | null;
          main_position?: string | null;
          overall?: number | null;
          potential?: number | null;
          photo_url?: string | null;
          external_source?: string | null;
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      squad_memberships: {
        Row: {
          id: string;
          player_id: string;
          team_id: string;
          season_id: string;
          shirt_number: number | null;
          joined_at: string | null;
          left_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          team_id: string;
          season_id: string;
          shirt_number?: number | null;
          joined_at?: string | null;
          left_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          team_id?: string;
          season_id?: string;
          shirt_number?: number | null;
          joined_at?: string | null;
          left_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "squad_memberships_player_id_fkey";
            columns: ["player_id"];
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "squad_memberships_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "squad_memberships_season_id_fkey";
            columns: ["season_id"];
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          }
        ];
      };
      transfers: {
        Row: {
          id: string;
          player_id: string;
          from_team_id: string | null;
          to_team_id: string;
          season_id: string;
          transfer_date: string;
          fee: number | null;
          transfer_type: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          from_team_id?: string | null;
          to_team_id: string;
          season_id: string;
          transfer_date: string;
          fee?: number | null;
          transfer_type: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          from_team_id?: string | null;
          to_team_id?: string;
          season_id?: string;
          transfer_date?: string;
          fee?: number | null;
          transfer_type?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transfers_player_id_fkey";
            columns: ["player_id"];
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_from_team_id_fkey";
            columns: ["from_team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_to_team_id_fkey";
            columns: ["to_team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transfers_season_id_fkey";
            columns: ["season_id"];
            referencedRelation: "seasons";
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
export type Season = Database["public"]["Tables"]["seasons"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type SquadMembership = Database["public"]["Tables"]["squad_memberships"]["Row"];
export type Transfer = Database["public"]["Tables"]["transfers"]["Row"];

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

export type SquadMembershipWithRelations = SquadMembership & {
  players: Player | null;
  teams: Team | null;
  seasons: Season | null;
};

export type TransferWithRelations = Transfer & {
  players: Player | null;
  seasons: Season | null;
  from_team: Team | null;
  to_team: Team | null;
};

export type PlayerWithHistory = Player & {
  currentTeam: CurrentTeam | null;
  squadMemberships: SquadMembershipWithRelations[];
  transfers: TransferWithRelations[];
};

export type CurrentTeam = {
  id: string;
  name: string;
  source: "squad_membership" | "transfer";
  date: string;
};
