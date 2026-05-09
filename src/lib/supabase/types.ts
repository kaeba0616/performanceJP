export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          name_ko: string
          name_ja: string | null
          name_en: string | null
          image_url: string | null
          instagram_url: string | null
          youtube_url: string | null
          x_url: string | null
          hit_songs: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name_ko: string
          name_ja?: string | null
          name_en?: string | null
          image_url?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          x_url?: string | null
          hit_songs?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name_ko?: string
          name_ja?: string | null
          name_en?: string | null
          image_url?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          x_url?: string | null
          hit_songs?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performances_artist_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["artist_id"]
          }
        ]
      }
      performances: {
        Row: {
          id: string
          artist_id: string | null
          type: 'solo' | 'festival'
          title: string
          venue: string | null
          city: string | null
          start_date: string
          end_date: string | null
          ticket_open_at: string | null
          presale_open_at: string | null
          price_info: string | null
          status: string
          image_url: string | null
          setlist: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id?: string | null
          type?: 'solo' | 'festival'
          title: string
          venue?: string | null
          city?: string | null
          start_date: string
          end_date?: string | null
          ticket_open_at?: string | null
          presale_open_at?: string | null
          price_info?: string | null
          status?: string
          image_url?: string | null
          setlist?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string | null
          type?: 'solo' | 'festival'
          title?: string
          venue?: string | null
          city?: string | null
          start_date?: string
          end_date?: string | null
          ticket_open_at?: string | null
          presale_open_at?: string | null
          price_info?: string | null
          status?: string
          image_url?: string | null
          setlist?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performances_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      performance_artists: {
        Row: {
          performance_id: string
          artist_id: string
          display_order: number
          created_at: string
        }
        Insert: {
          performance_id: string
          artist_id: string
          display_order?: number
          created_at?: string
        }
        Update: {
          performance_id?: string
          artist_id?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_artists_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      source_listings: {
        Row: {
          id: string
          performance_id: string | null
          source: string
          source_url: string
          source_id: string | null
          raw_title: string
          raw_data: Json | null
          ticket_open_at: string | null
          price_info: string | null
          last_crawled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          performance_id?: string | null
          source: string
          source_url: string
          source_id?: string | null
          raw_title: string
          raw_data?: Json | null
          ticket_open_at?: string | null
          price_info?: string | null
          last_crawled_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          performance_id?: string | null
          source?: string
          source_url?: string
          source_id?: string | null
          raw_title?: string
          raw_data?: Json | null
          ticket_open_at?: string | null
          price_info?: string | null
          last_crawled_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_listings_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
      subscribers: {
        Row: {
          id: string
          email: string
          verified: boolean
          verify_token: string | null
          subscribed_at: string
          unsubscribe_token: string
        }
        Insert: {
          id?: string
          email: string
          verified?: boolean
          verify_token?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Update: {
          id?: string
          email?: string
          verified?: boolean
          verify_token?: string | null
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          type: string
          target_id: string | null
          notify_ticket_open: boolean
          notify_new_performance: boolean
          created_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          type: string
          target_id?: string | null
          notify_ticket_open?: boolean
          notify_new_performance?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          type?: string
          target_id?: string | null
          notify_ticket_open?: boolean
          notify_new_performance?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          id: string
          submitter_email: string
          submitter_name: string | null
          submitter_ip: string | null
          submitter_note: string | null
          artist_id: string | null
          proposed_artist_name_ko: string | null
          proposed_artist_name_ja: string | null
          proposed_artist_name_en: string | null
          title: string
          venue: string | null
          city: string | null
          start_date: string
          end_date: string | null
          ticket_open_at: string | null
          presale_open_at: string | null
          price_info: string | null
          image_url: string | null
          source_url: string | null
          status: string
          admin_note: string | null
          rejection_reason: string | null
          approved_performance_id: string | null
          created_artist_id: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          submitter_email: string
          submitter_name?: string | null
          submitter_ip?: string | null
          submitter_note?: string | null
          artist_id?: string | null
          proposed_artist_name_ko?: string | null
          proposed_artist_name_ja?: string | null
          proposed_artist_name_en?: string | null
          title: string
          venue?: string | null
          city?: string | null
          start_date: string
          end_date?: string | null
          ticket_open_at?: string | null
          presale_open_at?: string | null
          price_info?: string | null
          image_url?: string | null
          source_url?: string | null
          status?: string
          admin_note?: string | null
          rejection_reason?: string | null
          approved_performance_id?: string | null
          created_artist_id?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          submitter_email?: string
          submitter_name?: string | null
          submitter_ip?: string | null
          submitter_note?: string | null
          artist_id?: string | null
          proposed_artist_name_ko?: string | null
          proposed_artist_name_ja?: string | null
          proposed_artist_name_en?: string | null
          title?: string
          venue?: string | null
          city?: string | null
          start_date?: string
          end_date?: string | null
          ticket_open_at?: string | null
          presale_open_at?: string | null
          price_info?: string | null
          image_url?: string | null
          source_url?: string | null
          status?: string
          admin_note?: string | null
          rejection_reason?: string | null
          approved_performance_id?: string | null
          created_artist_id?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_approved_performance_id_fkey"
            columns: ["approved_performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_created_artist_id_fkey"
            columns: ["created_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications_log: {
        Row: {
          id: string
          subscriber_id: string
          performance_id: string
          type: string
          sent_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          performance_id: string
          type: string
          sent_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          performance_id?: string
          type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          handle: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_attendances: {
        Row: {
          user_id: string
          performance_id: string
          attended_at: string
          note: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          performance_id: string
          attended_at?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          performance_id?: string
          attended_at?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_attendances_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
