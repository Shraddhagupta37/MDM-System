import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  alpha,
  Divider,
  Paper,
  Fade,
  Slide,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronRight as ChevronRightIcon,
  Devices as DevicesIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Update as UpdateIcon,
  Analytics as AnalyticsIcon,
  CloudSync as CloudSyncIcon,
  ArrowForward as ArrowForwardIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../theme.js';

const features = [
  {
    icon: <DevicesIcon sx={{ fontSize: 40 }} />,
    title: 'Centralized Device Registry',
    description: 'Track all devices with IMEI, version, OS, and location data in real-time.',
    color: '#60a5fa',
  },
  {
    icon: <UpdateIcon sx={{ fontSize: 40 }} />,
    title: 'Version Lifecycle Management',
    description: 'Maintain complete version history with compatibility matrices and release notes.',
    color: '#34d399',
  },
  {
    icon: <TimelineIcon sx={{ fontSize: 40 }} />,
    title: 'Controlled Rollouts',
    description: 'Phased updates with batch control, scheduling, and automatic retry mechanisms.',
    color: '#f59e0b',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'Downgrade Prevention',
    description: 'Strict version control with automatic downgrade blocking at all levels.',
    color: '#ef4444',
  },
  {
    icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    title: 'Real-time Analytics',
    description: 'Live dashboards with version distribution, success rates, and regional adoption.',
    color: '#8b5cf6',
  },
  {
    icon: <CloudSyncIcon sx={{ fontSize: 40 }} />,
    title: 'Complete Audit Trail',
    description: 'Immutable logs of every action with visual timelines for compliance.',
    color: '#ec4899',
  },
];

const stats = [
  { value: '10K+', label: 'Devices Managed', icon: <DevicesIcon /> },
  { value: '99.9%', label: 'Update Success Rate', icon: <CheckCircleIcon /> },
  { value: '24/7', label: 'Real-time Monitoring', icon: <TimelineIcon /> },
  { value: '100%', label: 'Audit Compliance', icon: <SecurityIcon /> },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'IT Director, TechCorp',
    content: 'This MDM system transformed how we manage our 5000+ devices. The phased rollouts saved us from major disruptions.',
    avatar: 'S',
  },
  {
    name: 'Michael Chen',
    role: 'DevOps Lead, InnovateLabs',
    content: 'The audit trail and version control features are exceptional. Compliance audits are now a breeze.',
    avatar: 'M',
  },
  {
    name: 'Priya Patel',
    role: 'Security Officer, FinServe',
    content: 'Downgrade prevention alone made this worth it. Our security posture has never been stronger.',
    avatar: 'P',
  },
];

function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#0a0a0a',
      background: 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.05) 0%, transparent 50%)',
    }}>
      {/* Navigation */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', backdropFilter: 'blur(10px)' }}>
        <Toolbar sx={{ py: 2 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              MDM System
            </Typography>
          </motion.div>

          <Box sx={{ flexGrow: 1 }} />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              variant="contained"
              onClick={handleGetStarted}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: '#60a5fa',
                '&:hover': { bgcolor: '#3b82f6' },
                borderRadius: 2,
                px: 3,
              }}
            >
              Login
            </Button>
          </motion.div>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 10 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Typography 
                variant="h1" 
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: 2,
                }}
              >
                <span style={{ color: '#ffffff' }}>Mobile Device </span>
                <span style={{ 
                  background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Management
                </span>
                <span style={{ color: '#ffffff' }}> System</span>
              </Typography>

              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#a1a1aa',
                  mb: 3,
                  fontWeight: 400,
                }}
              >
                Centralized tracking, version control, and controlled rollouts 
                for all Moveinsync mobile devices.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  endIcon={<ChevronRightIcon />}
                  sx={{
                    bgcolor: '#60a5fa',
                    '&:hover': { bgcolor: '#3b82f6' },
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{
                    borderColor: '#27272a',
                    color: '#ffffff',
                    '&:hover': { 
                      borderColor: '#60a5fa',
                      bgcolor: 'rgba(96, 165, 250, 0.1)',
                    },
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Learn More
                </Button>
              </Box>

              {/* Stats */}
              <Grid container spacing={3}>
                {stats.map((stat, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ color: '#60a5fa', fontWeight: 700 }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a1a1aa' }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  bgcolor: '#111111',
                  border: '1px solid #27272a',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#22c55e' }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#a1a1aa' }}>
                    MDM Dashboard Preview
                  </Typography>
                </Box>

                {/* Dashboard Preview */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #27272a' }}>
                      <CardContent>
                        <Typography variant="caption" sx={{ color: '#a1a1aa' }}>Total Devices</Typography>
                        <Typography variant="h4" sx={{ color: '#60a5fa' }}>2,847</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #27272a' }}>
                      <CardContent>
                        <Typography variant="caption" sx={{ color: '#a1a1aa' }}>Active Updates</Typography>
                        <Typography variant="h4" sx={{ color: '#34d399' }}>156</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #27272a' }}>
                      <CardContent>
                        <Typography variant="caption" sx={{ color: '#a1a1aa' }}>Version Distribution</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {[40, 30, 20, 10].map((value, i) => (
                            <Box key={i} sx={{ flex: 1 }}>
                              <Box sx={{ 
                                height: 80, 
                                bgcolor: `rgba(96, 165, 250, ${0.3 + i * 0.2})`,
                                borderRadius: 1,
                                mb: 0.5,
                              }} />
                              <Typography variant="caption" sx={{ color: '#a1a1aa' }}>
                                v4.{i}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box id="features" sx={{ bgcolor: '#111111', py: 10, borderTop: '1px solid #27272a', borderBottom: '1px solid #27272a' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Typography 
              variant="h2" 
              align="center" 
              sx={{ 
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                color: '#ffffff',
                mb: 2,
              }}
            >
              Enterprise-Grade Features
            </Typography>
            <Typography 
              variant="h6" 
              align="center" 
              sx={{ color: '#a1a1aa', mb: 6, maxWidth: 600, mx: 'auto' }}
            >
              Everything you need to manage your mobile device fleet securely and efficiently
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      bgcolor: '#1a1a1a',
                      border: '1px solid #27272a',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: feature.color,
                        boxShadow: `0 10px 30px -10px ${feature.color}`,
                      },
                    }}
                  >
                    <CardContent>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: alpha(feature.color, 0.1),
                          color: feature.color,
                          mb: 2,
                        }}
                      >
                        {feature.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ color: '#ffffff', mb: 1, fontWeight: 600 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#a1a1aa', lineHeight: 1.6 }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Typography 
            variant="h2" 
            align="center" 
            sx={{ 
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: '#ffffff',
              mb: 2,
            }}
          >
            Trusted by Industry Leaders
          </Typography>
          <Typography 
            variant="h6" 
            align="center" 
            sx={{ color: '#a1a1aa', mb: 6, maxWidth: 600, mx: 'auto' }}
          >
            See what our customers say about the MDM system
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    bgcolor: '#111111',
                    border: '1px solid #27272a',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #60a5fa, #c084fc)',
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="body1" sx={{ color: '#e4e4e7', mb: 3, fontStyle: 'italic' }}>
                      "{testimonial.content}"
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#60a5fa' }}>
                        {testimonial.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#a1a1aa' }}>
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: '#111111', py: 8, borderTop: '1px solid #27272a' }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card 
              sx={{ 
                bgcolor: '#1a1a1a',
                border: '1px solid #60a5fa',
                textAlign: 'center',
                p: 4,
              }}
            >
              <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>
                Ready to Get Started?
              </Typography>
              <Typography variant="body1" sx={{ color: '#a1a1aa', mb: 4, maxWidth: 500, mx: 'auto' }}>
                Join thousands of companies managing their mobile devices securely with our MDM system.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: '#60a5fa',
                  '&:hover': { bgcolor: '#3b82f6' },
                  borderRadius: 2,
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                }}
              >
                Access Dashboard
              </Button>
            </Card>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#0a0a0a', py: 4, borderTop: '1px solid #27272a' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                MDM System
              </Typography>
              <Typography variant="body2" sx={{ color: '#a1a1aa' }}>
                Enterprise-grade Mobile Device Management for Moveinsync applications.
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <IconButton sx={{ color: '#a1a1aa', '&:hover': { color: '#60a5fa' } }}>
                  <GitHubIcon />
                </IconButton>
                <IconButton sx={{ color: '#a1a1aa', '&:hover': { color: '#60a5fa' } }}>
                  <LinkedInIcon />
                </IconButton>
                <IconButton sx={{ color: '#a1a1aa', '&:hover': { color: '#60a5fa' } }}>
                  <TwitterIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ borderColor: '#27272a', my: 2 }} />
              <Typography variant="caption" sx={{ color: '#71717a', display: 'block', textAlign: 'center' }}>
                © 2024 Moveinsync MDM System. All rights reserved.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;