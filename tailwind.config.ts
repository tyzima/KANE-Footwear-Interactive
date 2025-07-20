import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'heading': ['Work Sans', 'sans-serif'],
				'blender': ['BlenderBook', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'viewer-bg': 'hsl(var(--viewer-bg))',
				'control-bg': 'hsl(var(--control-bg))',
				'control-hover': 'hsl(var(--control-hover))',
				'loading-primary': 'hsl(var(--loading-primary))',
				'loading-secondary': 'hsl(var(--loading-secondary))'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-viewer': 'var(--gradient-viewer)'
			},
			boxShadow: {
				'glow': 'var(--shadow-glow)',
				'control': 'var(--shadow-control)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'bounce': 'var(--transition-bounce)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%': { boxShadow: '0 0 5px hsl(var(--primary))', transform: 'scale(1)' },
					'100%': { boxShadow: '0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))', transform: 'scale(1.05)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'slide-down-fade-in': {
          'from': { opacity: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        // NEW ANIMATIONS
        'air-flow': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' },
        },
        'sugarcane-stage': {
          '0%, 100%': { opacity: '0', transform: 'scale(0.9)' },
          '10%, 40%': { opacity: '1', transform: 'scale(1)' },
          '50%, 90%': { opacity: '0', transform: 'scale(0.9)' },
        },
        'pellets-stage': {
          '0%, 45%': { opacity: '0' },
          '55%, 85%': { opacity: '1' },
          '95%, 100%': { opacity: '0' },
        },
        'shoe-stage': {
          '0%, 80%': { opacity: '0', transform: 'scale(0.9)' },
          '90%, 100%': { opacity: '1', transform: 'scale(1)' },
        }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'spin-slow': 'spin 3s linear infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
				'float': 'float 3s ease-in-out infinite',
				'slide-down-fade-in': 'slide-down-fade-in 0.3s ease-out forwards',
				'air-flow': 'air-flow 1.5s infinite linear',
				'sugarcane-stage': 'sugarcane-stage 3s ease-in-out infinite',
				'pellets-stage': 'pellets-stage 3s ease-in-out infinite',
				'shoe-stage': 'shoe-stage 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
