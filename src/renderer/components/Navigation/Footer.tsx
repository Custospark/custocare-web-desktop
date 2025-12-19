import React from 'react';
import { 
  Heart, Shield, Globe, 
  Mail, Phone, MapPin,
  Twitter, Linkedin, Github,
  Copyright, Sparkles, Activity
} from 'lucide-react';
import {type FooterProps } from '../../types/index';
import { cn } from '../../types/cn';

/**
 * Premium Footer Component
 * 
 * After 80 years of design evolution, this footer embodies:
 * - Timeless brand presence
 * - Perfect information architecture
 * - Exceptional social proof
 * - Unobtrusive sophistication
 * - Seamless user journey completion
 */
export const Footer: React.FC<FooterProps> = ({
  theme = 'dark',
  className,
  showContact = true,
  showSocial = true,
  showCopyright = true,
  compact = false
}) => {
  const isDark = theme === 'dark';
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className={cn(
        'relative py-4 px-6',
        'border-t backdrop-blur-xl',
        'transition-all duration-300',
        isDark 
          ? 'bg-gray-900/95 border-gray-800/50' 
          : 'bg-white/95 border-gray-200/60',
        className
      )}>
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className={cn(
                'text-sm font-bold',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                CustoCare
              </span>
              <span className={cn(
                'ml-2 px-1.5 py-0.5 text-xs font-bold rounded-full',
                isDark 
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300' 
                  : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700'
              )}>
                PRO
              </span>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-4">
            {showSocial && (
              <div className="flex items-center gap-2">
                {[Twitter, Linkedin, Github].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-300',
                      'hover:scale-110',
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                    aria-label={`Follow on ${Icon.name}`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
            
            {showCopyright && (
              <div className="flex items-center gap-1.5 text-xs">
                <Copyright className={cn(
                  'w-3 h-3',
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )} />
                <span className={cn(
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {currentYear} CustoCare AI
                </span>
              </div>
            )}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn(
      'relative',
      'border-t backdrop-blur-xl',
      'transition-all duration-300',
      isDark 
        ? 'bg-gradient-to-b from-gray-900/95 to-gray-950 border-gray-800/50' 
        : 'bg-gradient-to-b from-white/95 to-gray-50 border-gray-200/60',
      className
    )}>
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30" />

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 px-8 lg:px-12 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm">
                  <div className="absolute inset-0.5 rounded-full bg-emerald-400 animate-ping-slow" />
                </div>
              </div>
              <div>
                <h3 className={cn(
                  'text-xl font-bold',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  CustoCare AI
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'px-2 py-0.5 text-xs font-bold rounded-full border',
                    isDark 
                      ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                      : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 border-blue-200'
                  )}>
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Healthcare Pro
                  </span>
                </div>
              </div>
            </div>

            <p className={cn(
              'text-sm leading-relaxed',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              Revolutionizing healthcare through intelligent automation and predictive analytics for better patient outcomes.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className={cn(
                'p-3 rounded-lg border',
                isDark 
                  ? 'bg-gray-800/50 border-gray-700/50' 
                  : 'bg-white/50 border-gray-200'
              )}>
                <div className="flex items-center gap-2">
                  <Activity className={cn(
                    'w-4 h-4',
                    isDark ? 'text-cyan-400' : 'text-cyan-600'
                  )} />
                  <span className={cn(
                    'text-xs font-semibold',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    99.9%
                  </span>
                </div>
                <span className={cn(
                  'text-xs',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  Uptime
                </span>
              </div>
              <div className={cn(
                'p-3 rounded-lg border',
                isDark 
                  ? 'bg-gray-800/50 border-gray-700/50' 
                  : 'bg-white/50 border-gray-200'
              )}>
                <div className="flex items-center gap-2">
                  <Heart className={cn(
                    'w-4 h-4',
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  )} />
                  <span className={cn(
                    'text-xs font-semibold',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    2.4K+
                  </span>
                </div>
                <span className={cn(
                  'text-xs',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  Patients
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className={cn(
              'text-sm font-semibold uppercase tracking-wider',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              Platform
            </h4>
            <ul className="space-y-2">
              {['Dashboard', 'Patients', 'Encounters', 'Reports', 'Analytics'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className={cn(
                      'text-sm transition-all duration-300 hover:pl-2',
                      'flex items-center gap-2',
                      isDark 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <div className={cn(
                      'w-1 h-1 rounded-full transition-all duration-300',
                      isDark ? 'bg-gray-700 group-hover:bg-cyan-500' : 'bg-gray-300 group-hover:bg-blue-500'
                    )} />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className={cn(
              'text-sm font-semibold uppercase tracking-wider',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              Resources
            </h4>
            <ul className="space-y-2">
              {['Documentation', 'API Reference', 'Tutorials', 'Blog', 'Help Center'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className={cn(
                      'text-sm transition-all duration-300 hover:pl-2',
                      'flex items-center gap-2',
                      isDark 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <div className={cn(
                      'w-1 h-1 rounded-full transition-all duration-300',
                      isDark ? 'bg-gray-700 group-hover:bg-cyan-500' : 'bg-gray-300 group-hover:bg-blue-500'
                    )} />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          {showContact && (
            <div className="space-y-4">
              <h4 className={cn(
                'text-sm font-semibold uppercase tracking-wider',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                Contact
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:support@custocare.ai"
                    className={cn(
                      'flex items-center gap-3 text-sm transition-colors duration-300',
                      isDark 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                    )}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <span>support@custocare.ai</span>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+18005551234"
                    className={cn(
                      'flex items-center gap-3 text-sm transition-colors duration-300',
                      isDark 
                        ? 'text-gray-400 hover:text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                    )}>
                      <Phone className="w-4 h-4" />
                    </div>
                    <span>+1 (800) 555-1234</span>
                  </a>
                </li>
                <li>
                  <div className={cn(
                    'flex items-center gap-3 text-sm',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    <div className={cn(
                      'p-2 rounded-lg',
                      isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                    )}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span>San Francisco, CA</span>
                  </div>
                </li>
              </ul>

              {/* Social Links */}
              {showSocial && (
                <div className="pt-4">
                  <div className="flex items-center gap-2">
                    {[
                      { Icon: Twitter, label: 'Twitter', color: 'text-blue-400' },
                      { Icon: Linkedin, label: 'LinkedIn', color: 'text-blue-500' },
                      { Icon: Github, label: 'GitHub', color: 'text-gray-400' },
                      { Icon: Globe, label: 'Website', color: 'text-emerald-400' }
                    ].map((social) => (
                      <a
                        key={social.label}
                        href="#"
                        className={cn(
                          'p-2.5 rounded-xl transition-all duration-300',
                          'hover:scale-110 hover:shadow-lg',
                          isDark 
                            ? 'bg-gray-800/50 hover:bg-gray-800' 
                            : 'bg-white/50 hover:bg-white',
                          'border',
                          isDark 
                            ? 'border-gray-700/50 hover:border-gray-600' 
                            : 'border-gray-200/60 hover:border-gray-300'
                        )}
                        aria-label={`Follow on ${social.label}`}
                      >
                        <social.Icon className={cn('w-4 h-4', social.color)} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className={cn(
          'mt-8 lg:mt-12 pt-6 lg:pt-8 border-t',
          'flex flex-col lg:flex-row items-center justify-between gap-4',
          isDark ? 'border-gray-800/50' : 'border-gray-200/60'
        )}>
          <div className="flex items-center gap-6">
            {showCopyright && (
              <div className="flex items-center gap-2 text-sm">
                <Copyright className={cn(
                  'w-4 h-4',
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )} />
                <span className={cn(
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {currentYear} CustoCare AI. All rights reserved.
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <a
                href="#"
                className={cn(
                  'text-xs transition-colors duration-300',
                  isDark 
                    ? 'text-gray-500 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className={cn(
                  'text-xs transition-colors duration-300',
                  isDark 
                    ? 'text-gray-500 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Terms of Service
              </a>
              <a
                href="#"
                className={cn(
                  'text-xs transition-colors duration-300',
                  isDark 
                    ? 'text-gray-500 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Cookie Policy
              </a>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className={cn(
                'text-xs font-medium',
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              )}>
                System Operational
              </span>
            </div>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              isDark 
                ? 'bg-gray-800 text-gray-400' 
                : 'bg-gray-100 text-gray-600'
            )}>
              v4.2.1
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;