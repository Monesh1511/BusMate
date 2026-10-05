package com.busgo.service;

import com.busgo.dto.ReviewRequest;
import com.busgo.entity.Booking;
import com.busgo.entity.Review;
import com.busgo.entity.User;
import com.busgo.exception.BusinessException;
import com.busgo.model.BookingStatus;
import com.busgo.repository.BookingRepository;
import com.busgo.repository.ReviewRepository;
import com.busgo.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ReviewService(BookingRepository bookingRepository, ReviewRepository reviewRepository,
                         UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Review createForBooking(Long bookingId, ReviewRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException("Authentication is required");
        }
        User user = userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new BusinessException("User not found"));
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new BusinessException("Booking not found"));
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new BusinessException("You can review only your own booking");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BusinessException("Only confirmed or completed bookings can be reviewed");
        }
        if (reviewRepository.existsByBooking_Id(bookingId)) {
            throw new BusinessException("This booking already has a review");
        }

        Review review = new Review();
        review.setUser(user);
        review.setReviewerName(user.getName());
        review.setBooking(booking);
        review.setBus(booking.getSchedule().getBus());
        review.setRating(request.getRating());
        review.setCleanlinessRating(request.getCleanlinessRating());
        review.setComfortRating(request.getComfortRating());
        review.setPunctualityRating(request.getPunctualityRating());
        review.setStaffRating(request.getStaffRating());
        review.setBoardingRating(request.getBoardingRating());
        review.setTitle(request.getTitle().trim());
        review.setComment(request.getText().trim());
        return reviewRepository.save(review);
    }
}
