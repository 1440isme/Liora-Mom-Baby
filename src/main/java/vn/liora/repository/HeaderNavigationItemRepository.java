package vn.liora.repository;

import vn.liora.entity.HeaderNavigationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HeaderNavigationItemRepository extends JpaRepository<HeaderNavigationItem, Long> {

    List<HeaderNavigationItem> findByIsActiveTrueOrderByItemOrder();

    List<HeaderNavigationItem> findByIsActiveTrueAndIsCategoryParentTrueOrderByItemOrder();

    List<HeaderNavigationItem> findByIsActiveTrueAndParentItemIdOrderByItemOrder(Long parentItemId);

    List<HeaderNavigationItem> findByIsActiveTrueAndParentItemIdIsNullOrderByItemOrder();
}