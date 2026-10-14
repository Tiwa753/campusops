import Link from "next/link";
import Icon from "./icon";

const roles = [
  {
    icon: "book" as const,
    label: "STUDENTS",
    title: "Find where you belong.",
    description:
      "Explore campus organizations, discover opportunities, apply to take part, and keep up with your activity.",
    tone: "student",
  },
  {
    icon: "people" as const,
    label: "ORGANIZATION MANAGERS",
    title: "Bring your community together.",
    description:
      "Share opportunities, coordinate tasks, and review applications for the organization you lead.",
    tone: "manager",
  },
  {
    icon: "shield" as const,
    label: "ADMINISTRATORS",
    title: "See the whole campus.",
    description:
      "Oversee campus organizations, opportunities, applications, and participation from one place.",
    tone: "admin",
  },
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link href="/" className="brand" aria-label="CampusOps home">
          <span className="brand-mark">
            <Icon name="building" size={23} />
          </span>
          <span>
            campus<span className="brand-light">ops</span>
            <span className="brand-period">.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="#features">Features</Link>
          <Link href="#how-it-works">How it works</Link>
          <Link href="#organizations">For organizations</Link>
        </nav>
        <div className="landing-nav-actions">
          <Link href="/dashboard" className="landing-login">
            Sign in
          </Link>
          <Link href="/sign-up" className="button button-primary">
            Get started
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">
            CAMPUS ORGANIZATIONS, EVENTS, AND OPERATIONS
          </span>
          <h1>
            Your campus.
            <br />
            <span>Better connected.</span>
          </h1>
          <p>
            CampusOps brings student organizations, events, applications, and
            campus operations together in one shared workspace.
          </p>
          <div className="landing-hero-actions">
            <Link href="/sign-up" className="button button-primary">
              Get started
              <Icon name="arrow" size={17} />
            </Link>
            <Link href="#features" className="landing-secondary-action">
              Explore features
              <Icon name="chevron" size={15} />
            </Link>
          </div>
          <div className="landing-trust">
            <span className="landing-trust-icon">
              <Icon name="shield" size={16} />
            </span>
            <span>
              The right workspace and tools
              <strong> for each campus role.</strong>
            </span>
          </div>
        </div>

        <div
          className="landing-preview"
          role="img"
          aria-label="Illustrative CampusOps dashboard preview showing organizations, events, applications, and analytics"
        >
          <div className="landing-preview-window">
            <div className="landing-preview-top">
              <div className="landing-preview-brand">
                <span className="landing-preview-mark">
                  <Icon name="building" size={15} />
                </span>
                campus<span>ops</span>
              </div>
              <span className="landing-preview-campus">
                <Icon name="book" size={14} />
                CAMPUS WORKSPACE
              </span>
              <span className="landing-preview-avatar">CO</span>
            </div>
            <div className="landing-preview-body">
              <div className="landing-preview-heading">
                <div>
                  <span>DASHBOARD PREVIEW</span>
                  <strong>Your campus, at a glance.</strong>
                </div>
                <span className="landing-preview-create">
                  <Icon name="plus" size={13} />
                  Create
                </span>
              </div>
              <div className="landing-preview-stats">
                <div>
                  <span>Organizations</span>
                  <strong>Discover</strong>
                  <i className="preview-stat-building">
                    <Icon name="building" size={14} />
                  </i>
                </div>
                <div>
                  <span>Events</span>
                  <strong>Explore</strong>
                  <i className="preview-stat-calendar">
                    <Icon name="calendar" size={14} />
                  </i>
                </div>
                <div>
                  <span>Applications</span>
                  <strong>Manage</strong>
                  <i className="preview-stat-file">
                    <Icon name="file" size={14} />
                  </i>
                </div>
              </div>
              <div className="landing-preview-content">
                <div className="landing-preview-events">
                  <div className="landing-preview-section-title">
                    <strong>Coming up on campus</strong>
                    <span>View all</span>
                  </div>
                  <div className="landing-preview-event">
                    <span className="landing-event-icon green">
                      <Icon name="calendar" size={15} />
                    </span>
                    <span>
                      <strong>Build Together: Campus Hackathon</strong>
                      <small>Published · Tech & Innovation Club</small>
                    </span>
                    <Icon name="chevron" size={14} />
                  </div>
                  <div className="landing-preview-event">
                    <span className="landing-event-icon purple">
                      <Icon name="book" size={15} />
                    </span>
                    <span>
                      <strong>The Creative Exchange</strong>
                      <small>Published · Creative Arts Society</small>
                    </span>
                    <Icon name="chevron" size={14} />
                  </div>
                  <div className="landing-preview-event">
                    <span className="landing-event-icon orange">
                      <Icon name="leaf" size={15} />
                    </span>
                    <span>
                      <strong>A Greener Campus</strong>
                      <small>Published · Campus Impact</small>
                    </span>
                    <Icon name="chevron" size={14} />
                  </div>
                </div>
                <div className="landing-preview-activity">
                  <div className="landing-preview-section-title">
                    <strong>Campus pulse</strong>
                    <Icon name="activity" size={15} />
                  </div>
                  <div className="landing-mini-chart" aria-hidden="true">
                    {[35, 53, 42, 75, 58, 88, 67, 100, 74, 91, 61, 82].map(
                      (height, index) => (
                        <span
                          key={index}
                          style={{ height: `${height}%` }}
                        />
                      ),
                    )}
                  </div>
                  <small>More ways to take part, all in one place.</small>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-float-card">
            <span className="landing-float-check">
              <Icon name="check" size={15} />
            </span>
            <span>
              <strong>You&apos;re in the loop</strong>
              <small>One campus. More connection.</small>
            </span>
          </div>
        </div>
      </section>

      <section className="landing-how" id="features">
        <div className="landing-section-heading">
          <span className="landing-eyebrow">ONE CONNECTED CAMPUS WORKSPACE</span>
          <h2>Campus work, all in one place.</h2>
          <p>
            Tools for students, organization leaders, and administrators to
            coordinate the activities that make campus life happen.
          </p>
        </div>
        <div className="landing-feature-grid">
          <article className="landing-feature">
            <span className="landing-feature-icon feature-green">
              <Icon name="calendar" size={21} />
            </span>
            <span>EVENT MANAGEMENT</span>
            <h3>Plan and publish campus events.</h3>
            <p>
              Keep event details, schedules, capacity, and participation
              organized in one place.
            </p>
          </article>
          <article className="landing-feature">
            <span className="landing-feature-icon feature-blue">
              <Icon name="people" size={21} />
            </span>
            <span>STUDENT ORGANIZATIONS</span>
            <h3>Give campus communities a home.</h3>
            <p>
              Discover organizations and support leaders with tools for their
              membership and activities.
            </p>
          </article>
          <article className="landing-feature">
            <span className="landing-feature-icon feature-gold">
              <Icon name="file" size={21} />
            </span>
            <span>APPLICATIONS & REGISTRATIONS</span>
            <h3>Make it clear how to take part.</h3>
            <p>
              Collect event applications and registrations, then follow their
              review and status.
            </p>
          </article>
          <article className="landing-feature">
            <span className="landing-feature-icon feature-green">
              <Icon name="chart" size={21} />
            </span>
            <span>ANALYTICS</span>
            <h3>Understand campus activity.</h3>
            <p>
              Review participation and operational activity to help guide
              decisions across your campus.
            </p>
          </article>
          <article className="landing-feature">
            <span className="landing-feature-icon feature-blue">
              <Icon name="shield" size={21} />
            </span>
            <span>ROLE-BASED ACCESS</span>
            <h3>Tools matched to each role.</h3>
            <p>
              Keep student participation, organization management, and
              administration workspaces distinct.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-roles landing-journeys" id="how-it-works">
        <div className="landing-section-heading">
          <span className="landing-eyebrow">HOW IT WORKS</span>
          <h2>One campus, connected journeys.</h2>
          <p>
            Each person has a clear path through the campus workspace, from
            discovering opportunities to coordinating them.
          </p>
        </div>
        <div className="landing-role-grid landing-journey-grid">
          {roles.map((role) => (
            <article className={`landing-role-card ${role.tone}`} key={role.label}>
              <span className="landing-role-icon">
                <Icon name={role.icon} size={21} />
              </span>
              <span className="landing-role-label">{role.label}</span>
              <h3>{role.title}</h3>
              <p>{role.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-organization" id="organizations">
        <div className="landing-organization-copy">
          <span className="landing-eyebrow">FOR ORGANIZATIONS</span>
          <h2>More time for the work your community came to do.</h2>
          <p>
            Bring your organization&apos;s opportunities, applications, and
            tasks into a shared workspace. Approved leaders can manage their
            organization while keeping their student identity.
          </p>
          <Link href="/sign-up" className="landing-secondary-action">
            Get started
            <Icon name="chevron" size={15} />
          </Link>
        </div>
        <div className="landing-organization-list">
          <div>
            <span className="landing-organization-icon">
              <Icon name="calendar" size={18} />
            </span>
            <span>
              <strong>Publish opportunities</strong>
              <small>Share events and programs with students.</small>
            </span>
          </div>
          <div>
            <span className="landing-organization-icon">
              <Icon name="file" size={18} />
            </span>
            <span>
              <strong>Review applications</strong>
              <small>Keep registrations and decisions together.</small>
            </span>
          </div>
          <div>
            <span className="landing-organization-icon">
              <Icon name="tasks" size={18} />
            </span>
            <span>
              <strong>Coordinate the details</strong>
              <small>Track the work behind campus activities.</small>
            </span>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-mark">
          <Icon name="spark" size={23} />
        </div>
        <div>
          <span className="landing-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>Make more of your campus.</h2>
          <p>Find your people. Find your next opportunity. Make it count.</p>
        </div>
        <Link href="/sign-up" className="button landing-cta-button">
          Get started
          <Icon name="arrow" size={16} />
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-main">
          <Link href="/" className="brand" aria-label="CampusOps home">
            <span className="brand-mark">
              <Icon name="building" size={19} />
            </span>
            <span>
              campus<span className="brand-light">ops</span>
              <span className="brand-period">.</span>
            </span>
          </Link>
          <p>One workspace for campus organizations and opportunities.</p>
        </div>
        <nav className="landing-footer-nav" aria-label="Product navigation">
          <strong>Explore</strong>
          <Link href="#features">Features</Link>
          <Link href="#how-it-works">How it works</Link>
          <Link href="#organizations">For organizations</Link>
          <Link href="/dashboard">Sign in</Link>
        </nav>
        <div className="landing-footer-nav landing-footer-contact">
          <strong>Contact</strong>
          <a href="mailto:hello@campusops.example">
            hello@campusops.example
          </a>
          <span>Contact address placeholder</span>
        </div>
        <div className="landing-footer-legal">
          <strong>Legal</strong>
          <a href="#privacy-policy">Privacy policy</a>
          <a href="#terms-of-service">Terms of service</a>
          <p id="privacy-policy">
            Privacy policy will be published before launch.
          </p>
          <p id="terms-of-service">
            Terms of service will be published before launch.
          </p>
        </div>
        <div className="landing-footer-bottom">
          <span>An independent product preview.</span>
          <span>© {new Date().getFullYear()} CampusOps</span>
        </div>
      </footer>
    </main>
  );
}
