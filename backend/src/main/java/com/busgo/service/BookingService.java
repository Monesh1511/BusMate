package com.busgo.service;

import com.busgo.dto.BookingRequest;
import com.busgo.dto.SeatOption;
import com.busgo.entity.Booking;
import com.busgo.entity.BookingPassenger;
import com.busgo.entity.BookingSeat;
import com.busgo.entity.CancellationPolicy;
import com.busgo.entity.Payment;
import com.busgo.entity.Schedule;
import com.busgo.entity.Seat;
import com.busgo.entity.User;
import com.busgo.exception.BusinessException;
import com.busgo.model.BookingStatus;
import com.busgo.repository.BookingRepository;
import com.busgo.repository.BookingSeatRepository;
import com.busgo.repository.CancellationPolicyRepository;
import com.busgo.repository.PaymentRepository;
import com.busgo.repository.ScheduleRepository;
import com.busgo.repository.SeatRepository;
import com.busgo.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class BookingService {
    private static final BigDecimal SERVICE_FEE_PER_SEAT = new BigDecimal("20.00");
    private static final Set<String> PAYMENT_METHODS = Set.of("UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING", "WALLET");

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final CancellationPolicyRepository cancellationPolicyRepository;
    private final PaymentRepository paymentRepository;
    private final ScheduleRepository scheduleRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository,
                          BookingSeatRepository bookingSeatRepository,
                          CancellationPolicyRepository cancellationPolicyRepository,
                          PaymentRepository paymentRepository,
                          ScheduleRepository scheduleRepository,
                          SeatRepository seatRepository,
                          UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingSeatRepository = bookingSeatRepository;
        this.cancellationPolicyRepository = cancellationPolicyRepository;
        this.paymentRepository = paymentRepository;
        this.scheduleRepository = scheduleRepository;
        this.seatRepository = seatRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Booking createBooking(BookingRequest request) {
        if (request == null || request.getScheduleId() == null) {
            throw new BusinessException("Schedule selection is required");
        }

        List<Long> seatIds = request.getSeatIds() == null ? List.of() : request.getSeatIds();
        if (seatIds.isEmpty() || seatIds.size() > 6 || new HashSet<>(seatIds).size() != seatIds.size()) {
            throw new BusinessException("Select between one and six distinct available seats");
        }

        User user = currentUser();
        Schedule schedule = scheduleRepository.findByIdForUpdate(request.getScheduleId())
            .orElseThrow(() -> new BusinessException("Schedule not found"));
        if (!schedule.isActive()) {
            throw new BusinessException("This schedule is not available for booking");
        }
        if (schedule.getFare() == null || schedule.getFare().signum() < 0) {
            throw new BusinessException("This schedule has no valid fare");
        }

        List<Seat> selectedSeats = seatRepository.findAllById(seatIds);
        if (selectedSeats.size() != seatIds.size()) {
            throw new BusinessException("Seat information is not configured for this bus");
        }
        Integer busId = schedule.getBus().getId();
        if (selectedSeats.stream().anyMatch(seat -> !busId.equals(seat.getBus().getId()))) {
            throw new BusinessException("Selected seat does not belong to this bus");
        }
        var seatsById = selectedSeats.stream().collect(
            java.util.stream.Collectors.toMap(Seat::getId, seat -> seat));
        List<Seat> seats = seatIds.stream().map(seatsById::get).toList();

        Set<Long> occupiedSeatIds = new HashSet<>();
        bookingSeatRepository.findBySchedule_IdAndActiveTrue(schedule.getId())
            .forEach(bookingSeat -> occupiedSeatIds.add(bookingSeat.getSeat().getId()));
        if (seatIds.stream().anyMatch(occupiedSeatIds::contains)) {
            throw new BusinessException("One or more selected seats are no longer available");
        }

        List<BookingRequest.PassengerRequest> passengerRequests = normalizePassengers(request, seatIds.size());
        if (passengerRequests.size() != seatIds.size()) {
            throw new BusinessException("Each selected seat must have one passenger");
        }
        String paymentMethod = normalizePaymentMethod(request.getPaymentMethod());

        Booking booking = new Booking();
        booking.setBookingReference("BUS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        booking.setUser(user);
        booking.setSchedule(schedule);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaymentStatus("PAID");
        booking.setTotalAmount(schedule.getFare().multiply(BigDecimal.valueOf(seats.size()))
            .add(SERVICE_FEE_PER_SEAT.multiply(BigDecimal.valueOf(seats.size()))));

        List<BookingPassenger> passengers = new ArrayList<>();
        List<BookingSeat> bookingSeats = new ArrayList<>();
        for (int index = 0; index < seats.size(); index++) {
            BookingRequest.PassengerRequest requestPassenger = passengerRequests.get(index);
            if (requestPassenger.getAgeValue() <= 0 || requestPassenger.getAgeValue() >= 120) {
                throw new BusinessException("Passenger age must be between 1 and 119");
            }
            String passengerName = valueOr(requestPassenger.getName(), null);
            if (passengerName == null || passengerName.length() > 100) {
                throw new BusinessException("Passenger name is required and must be 100 characters or fewer");
            }

            BookingPassenger passenger = new BookingPassenger();
            passenger.setBooking(booking);
            passenger.setSeat(seats.get(index));
            passenger.setName(passengerName);
            passenger.setAge(requestPassenger.getAgeValue());
            passenger.setGender(normalizeGender(requestPassenger.getGender()));
            String phone = valueOr(requestPassenger.getPhone(), null);
            String email = valueOr(requestPassenger.getEmail(), null);
            if (phone != null && phone.length() > 20) {
                throw new BusinessException("Passenger phone must be 20 characters or fewer");
            }
            if (email != null && email.length() > 150) {
                throw new BusinessException("Passenger email must be 150 characters or fewer");
            }
            passenger.setPhone(phone);
            passenger.setEmail(email);
            passengers.add(passenger);

            BookingSeat bookingSeat = new BookingSeat();
            bookingSeat.setBooking(booking);
            bookingSeat.setSchedule(schedule);
            bookingSeat.setSeat(seats.get(index));
            bookingSeat.setPassenger(passenger);
            bookingSeat.setActive(true);
            bookingSeats.add(bookingSeat);
        }
        booking.setPassengers(passengers);
        booking.setBookingSeats(bookingSeats);

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getTotalAmount());
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentStatus("PAID");
        payment.setTransactionReference("DEMO-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT));
        payment.setPaidAt(OffsetDateTime.now());
        payment.setRefundAmount(BigDecimal.ZERO);
        booking.setPayments(List.of(payment));

        return bookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsForCurrentUser() {
        return bookingRepository.findByUserOrderByCreatedAtDesc(currentUser());
    }

    @Transactional
    public Booking cancelBooking(Long bookingId) {
        User user = currentUser();
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
            .orElseThrow(() -> new BusinessException("Booking not found"));
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new BusinessException("You can cancel only your own booking");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BusinessException("Only confirmed bookings can be cancelled");
        }

        Schedule schedule = scheduleRepository.findByIdForUpdate(booking.getSchedule().getId())
            .orElseThrow(() -> new BusinessException("Schedule not found"));
        OffsetDateTime cancelledAt = OffsetDateTime.now();
        if (schedule.getDepartureAt() == null || !schedule.getDepartureAt().isAfter(cancelledAt)) {
            throw new BusinessException("A booking cannot be cancelled after departure");
        }

        long hoursBeforeDeparture = Duration.between(cancelledAt, schedule.getDepartureAt()).toHours();
        int refundPercentage = cancellationPolicyRepository
            .findBySchedule_IdOrderByHoursBeforeDepartureDesc(schedule.getId())
            .stream()
            .filter(policy -> hoursBeforeDeparture >= policy.getHoursBeforeDeparture())
            .map(CancellationPolicy::getRefundPercentage)
            .findFirst()
            .orElse(0);

        BigDecimal refundTotal = BigDecimal.ZERO;
        for (Payment payment : paymentRepository.findByBooking_Id(bookingId)) {
            BigDecimal refund = payment.getAmount()
                .multiply(BigDecimal.valueOf(refundPercentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            payment.setRefundAmount(refund);
            if (refund.signum() > 0) {
                payment.setPaymentStatus("REFUND_PENDING");
                refundTotal = refundTotal.add(refund);
            }
        }
        if (refundTotal.signum() > 0) {
            booking.setPaymentStatus("REFUND_PENDING");
        }

        bookingSeatRepository.findByBooking_IdAndActiveTrue(bookingId)
            .forEach(bookingSeat -> bookingSeat.setActive(false));
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(cancelledAt);
        return bookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public List<SeatOption> getSeatAvailability(Long scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new BusinessException("Schedule not found"));
        Set<Long> occupiedSeatIds = new HashSet<>();
        bookingSeatRepository.findBySchedule_IdAndActiveTrue(scheduleId)
            .forEach(bookingSeat -> occupiedSeatIds.add(bookingSeat.getSeat().getId()));
        return seatRepository.findByBus_IdOrderByRowNumberAscColumnNumberAsc(schedule.getBus().getId())
            .stream()
            .map(seat -> new SeatOption(seat.getId(), seat.getSeatNumber(), seat.getSeatType(),
                seat.getRowNumber(), seat.getColumnNumber(), seat.getDeck(), !occupiedSeatIds.contains(seat.getId())))
            .toList();
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BusinessException("Authentication is required");
        }
        return userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new BusinessException("User not found"));
    }

    private List<BookingRequest.PassengerRequest> normalizePassengers(BookingRequest request, int seatCount) {
        List<BookingRequest.PassengerRequest> passengers = request.getPassengers();
        if (passengers == null || passengers.size() != seatCount || passengers.stream().anyMatch(java.util.Objects::isNull)) {
            throw new BusinessException("Enter passenger details for every selected seat");
        }
        return new ArrayList<>(passengers);
    }

    private String normalizePaymentMethod(String paymentMethod) {
        String normalized = paymentMethod == null || paymentMethod.isBlank()
            ? "UPI" : paymentMethod.trim().toUpperCase(Locale.ROOT);
        if (!PAYMENT_METHODS.contains(normalized)) {
            throw new BusinessException("Unsupported payment method");
        }
        return normalized;
    }

    private String normalizeGender(String gender) {
        if (gender == null || gender.isBlank()) {
            throw new BusinessException("Passenger gender is required");
        }
        return switch (gender.trim().toUpperCase(Locale.ROOT)) {
            case "MALE" -> "MALE";
            case "FEMALE" -> "FEMALE";
            case "OTHER" -> "OTHER";
            default -> throw new BusinessException("Passenger gender must be Male, Female, or Other");
        };
    }

    private String valueOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
