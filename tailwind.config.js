/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
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
  			bnm: {
  				bg: 'hsl(var(--bnm-bg))',
  				surface: 'hsl(var(--bnm-surface))',
  				card: 'hsl(var(--bnm-card))',
  				border: 'hsl(var(--bnm-border))',
  				text: 'hsl(var(--bnm-text))',
  				secondary: 'hsl(var(--bnm-text-secondary))',
  				pink: 'hsl(var(--bnm-pink))',
  				magenta: 'hsl(var(--bnm-magenta))',
  				violet: 'hsl(var(--bnm-violet))'
  			},
  			semantic: {
  				canvas: 'hsl(var(--semantic-canvas))',
  				'canvas-subtle': 'hsl(var(--semantic-canvas-subtle))',
  				surface: 'hsl(var(--semantic-surface))',
  				'surface-raised': 'hsl(var(--semantic-surface-raised))',
  				'surface-sunken': 'hsl(var(--semantic-surface-sunken))',
  				'surface-overlay': 'hsl(var(--semantic-surface-overlay))',
  				'text-primary': 'hsl(var(--semantic-text-primary))',
  				'text-secondary': 'hsl(var(--semantic-text-secondary))',
  				'text-tertiary': 'hsl(var(--semantic-text-tertiary))',
  				'text-inverse': 'hsl(var(--semantic-text-inverse))',
  				'border-subtle': 'hsl(var(--semantic-border-subtle))',
  				'border-default': 'hsl(var(--semantic-border-default))',
  				'border-strong': 'hsl(var(--semantic-border-strong))',
  				'border-focus': 'hsl(var(--semantic-border-focus))',
  				action: 'hsl(var(--semantic-action-primary))',
  				'action-fg': 'hsl(var(--semantic-action-primary-fg))',
  				'status-success': 'hsl(var(--semantic-status-success))',
  				'status-warning': 'hsl(var(--semantic-status-warning))',
  				'status-danger': 'hsl(var(--semantic-status-danger))',
  				'status-info': 'hsl(var(--semantic-status-info))',
  				'nav-active': 'hsl(var(--semantic-nav-active))',
  				'nav-inactive': 'hsl(var(--semantic-nav-inactive))'
  			}
  		},
  		boxShadow: {
  			'ev-none': 'none',
  			'ev-hairline': '0 0 0 1px rgba(255, 255, 255, 0.08)',
  			'ev-low': '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
  			'ev-medium': '0 4px 12px 0 rgba(0, 0, 0, 0.4)',
  			'ev-high': '0 12px 32px 0 rgba(0, 0, 0, 0.5)',
  			'ev-ambient': '0 0 40px 0 rgba(0, 0, 0, 0.3)',
  			'ev-dark-ambient': '0 0 1px 0 rgba(255, 255, 255, 0.14), 0 8px 24px -4px rgba(0, 0, 0, 0.6)',
  			'ev-inset': 'inset 0 1px 3px 0 rgba(0, 0, 0, 0.4)',
  			'ev-fab': '0 8px 24px -4px rgba(236, 72, 153, 0.5)',
  			'ev-media-overlay': '0 0 0 1px rgba(255, 255, 255, 0.08)'
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
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
