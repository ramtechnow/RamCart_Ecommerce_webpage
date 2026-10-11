import * as React from "react";
import { cn } from "src/lib/utils";
import { InfiniteSlider } from "src/Components/ui/infinite-slider";
import { Avatar, AvatarFallback, AvatarImage } from "src/Components/ui/avatar";
import { Star } from "lucide-react";

type Testimonial = {
  quote: string;
  image: string;
  name: string;
  role: string;
  location?: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    quote: "Super fast delivery! Ordered Monday morning and it arrived Tuesday evening. The kurta set fits perfectly and looks exactly like the photos. Will definitely order again!",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    name: "Priya Ramesh",
    role: "Verified Buyer",
    location: "Chennai",
    rating: 5,
  },
  {
    quote: "Best online shopping experience I've had. The size chart is 100% accurate — first time ordering clothes online and everything fits perfectly. The fabric quality is outstanding.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop",
    name: "Arjun Mehta",
    role: "Verified Buyer",
    location: "Bangalore",
    rating: 5,
  },
  {
    quote: "RamCart's collection is so trendy! Got my new dress and received so many compliments at the office. The material is premium and the stitching is flawless.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    name: "Kavitha Sundaram",
    role: "Verified Buyer",
    location: "Coimbatore",
    rating: 5,
  },
  {
    quote: "Ordered 3 items for my daughter — all arrived in excellent condition. The kids' wear section has great variety and the quality is durable even after multiple washes.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    name: "Meena Krishnamurthy",
    role: "Verified Buyer",
    location: "Madurai",
    rating: 5,
  },
  {
    quote: "I was skeptical about ordering clothes online but RamCart changed my mind! The return process was effortless and the new replacement arrived within 2 days. 10/10 service!",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop",
    name: "Vikram Singh",
    role: "Verified Buyer",
    location: "Hyderabad",
    rating: 5,
  },
  {
    quote: "Amazing price for this quality! The linen shirt I bought looks and feels like it cost 3x the price. Great deals on RamCart — bookmark this site!",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=150&auto=format&fit=crop",
    name: "Divya Nair",
    role: "Verified Buyer",
    location: "Kochi",
    rating: 5,
  },
  {
    quote: "The product images are very accurate to the real item. No unpleasant surprises! Fast shipping, secure packaging and the product is exactly as described. Highly recommended!",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
    name: "Ramesh Babu",
    role: "Verified Buyer",
    location: "Pune",
    rating: 4,
  },
  {
    quote: "Bought a saree for my sister's wedding and it was absolutely gorgeous. The color was vibrant, exactly matching the picture. Free delivery and it arrived 2 days early!",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=150&auto=format&fit=crop",
    name: "Anitha Jayakumar",
    role: "Verified Buyer",
    location: "Salem",
    rating: 5,
  },
  {
    quote: "Customer support is top class. Had a small issue with my order and the team resolved it within an hour. This kind of service is rare these days. Will keep shopping here!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    name: "Suresh Palani",
    role: "Verified Buyer",
    location: "Trichy",
    rating: 5,
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export function TestimonialsSection() {
  return (
    <section className="relative py-10" style={{ margin: "40px 0" }}>
      <div className="mx-auto max-w-5xl" style={{ padding: "0 16px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ color: "var(--accent-pink)", fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
            Customer Love
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            ⭐ Real Reviews from Verified Buyers
          </h2>
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
            50,000+ happy customers across India trust RamCart
          </p>
        </div>

        {/* Animated columns — streamlined vertical footprint */}
        <div
          className={cn(
            "flex justify-center gap-5 overflow-hidden",
          )}
          style={{ maxHeight: 380, maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)" }}
        >
          <InfiniteSlider direction="vertical" speed={24} speedOnHover={10}>
            {firstColumn.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </InfiniteSlider>
          <InfiniteSlider
            className="hidden md:block"
            direction="vertical"
            speed={38}
            speedOnHover={15}
          >
            {secondColumn.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </InfiniteSlider>
          <InfiniteSlider
            className="hidden lg:block"
            direction="vertical"
            speed={28}
            speedOnHover={12}
          >
            {thirdColumn.map((testimonial) => (
              <TestimonialCard key={testimonial.name} testimonial={testimonial} />
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  className,
  ...props
}: React.ComponentProps<"figure"> & { testimonial: Testimonial }) {
  const { quote, image, name, role, location, rating } = testimonial;
  return (
    <figure
      className={cn(
        "w-full max-w-xs rounded-2xl p-6",
        className
      )}
      style={{
        border: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
      }}
      {...props}
    >
      {/* Stars */}
      <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={13}
            fill={i < rating ? "var(--accent-pink)" : "none"}
            stroke={i < rating ? "var(--accent-pink)" : "var(--border-color)"}
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>
        "{quote}"
      </blockquote>

      {/* Author */}
      <figcaption style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar className="size-9 rounded-full">
          <AvatarImage alt={`${name}'s profile picture`} src={image} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <cite style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontStyle: "normal", display: "block" }}>
            {name}
          </cite>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {role}{location && ` · ${location}`}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}

export default TestimonialsSection;
